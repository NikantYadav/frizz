// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Arbitration
 * @dev Handles staked juror system for dispute resolution
 * Implements Kleros-inspired arbitration mechanism
 */
contract Arbitration is ReentrancyGuard {
    IERC20 public immutable arbitrationToken;
    address public marketplace;

    uint256 public constant STAKE_AMOUNT = 100 * 10 ** 18; // 100 tokens
    uint256 public constant ARBITRATION_FEE = 0.01 ether;
    uint256 public constant INITIAL_JUROR_COUNT = 3;
    uint256 public constant APPEAL_JUROR_INCREMENT = 2;

    struct Juror {
        bool isStaked;
        string[] categories;
        uint256 stakedAmount;
        uint256 casesVoted;
        uint256 correctVotes;
    }

    struct Dispute {
        uint256 disputeId;
        uint256 jobId;
        address client;
        address worker;
        string category;
        uint256 amount;
        bool isActive;
        bool isResolved;
        uint256 votesForClient;
        uint256 votesForWorker;
        uint256 jurorCount;
        uint256 appealCount;
        address[] selectedJurors;
        mapping(address => bytes32) commitHashes; // Map juror to commit hash
        mapping(address => bool) hasCommitted;
        mapping(address => bool) hasRevealed;
        mapping(address => bool) votedForClient;
        uint256 arbitrationFeePaid;
        string[] evidence; // Array of IPFS hashes
        uint256 createdAt;
        uint256 commitPeriodEnd;
        uint256 revealPeriodEnd;
    }

    mapping(address => Juror) public jurors;
    mapping(string => address[]) public jurorsByCategory;
    mapping(uint256 => Dispute) public disputes;
    uint256 public disputeCounter;

    event JurorStaked(
        address indexed juror,
        uint256 amount,
        string[] categories
    );
    event JurorUnstaked(address indexed juror, uint256 amount);
    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        string category
    );
    event JurorSelected(uint256 indexed disputeId, address indexed juror);
    event VoteCast(
        uint256 indexed disputeId,
        address indexed juror,
        bool votedForClient
    );
    event DisputeResolved(
        uint256 indexed disputeId,
        bool clientWon,
        uint256 majorityVotes
    );
    event DisputeAppealed(uint256 indexed disputeId, uint256 newJurorCount);
    event RewardsDistributed(
        uint256 indexed disputeId,
        address[] winners,
        uint256 rewardPerJuror
    );
    event EvidenceSubmitted(
        uint256 indexed disputeId,
        address indexed submitter,
        string evidenceHash
    );
    event VoteCommitted(uint256 indexed disputeId, address indexed juror);
    event VoteRevealed(
        uint256 indexed disputeId,
        address indexed juror,
        bool voteForClient
    );

    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "Only marketplace");
        _;
    }

    constructor(address _arbitrationToken) {
        arbitrationToken = IERC20(_arbitrationToken);
    }

    /**
     * @dev Set marketplace address (only once)
     */
    function setMarketplace(address _marketplace) external {
        require(marketplace == address(0), "Marketplace already set");
        marketplace = _marketplace;
    }

    /**
     * @dev Stake tokens to become a juror
     */
    function stakeAsJuror(string[] memory _categories) external nonReentrant {
        require(!jurors[msg.sender].isStaked, "Already staked");
        require(_categories.length > 0, "Must specify categories");
        require(
            arbitrationToken.transferFrom(
                msg.sender,
                address(this),
                STAKE_AMOUNT
            ),
            "Stake transfer failed"
        );

        jurors[msg.sender] = Juror({
            isStaked: true,
            categories: _categories,
            stakedAmount: STAKE_AMOUNT,
            casesVoted: 0,
            correctVotes: 0
        });

        // Add to category mappings
        for (uint256 i = 0; i < _categories.length; i++) {
            jurorsByCategory[_categories[i]].push(msg.sender);
        }

        emit JurorStaked(msg.sender, STAKE_AMOUNT, _categories);
    }

    /**
     * @dev Unstake tokens and stop being a juror
     */
    function unstake() external nonReentrant {
        require(jurors[msg.sender].isStaked, "Not staked");

        uint256 amount = jurors[msg.sender].stakedAmount;
        string[] memory categories = jurors[msg.sender].categories;

        // Remove from category mappings
        for (uint256 i = 0; i < categories.length; i++) {
            _removeJurorFromCategory(msg.sender, categories[i]);
        }

        delete jurors[msg.sender];

        require(
            arbitrationToken.transfer(msg.sender, amount),
            "Unstake transfer failed"
        );

        emit JurorUnstaked(msg.sender, amount);
    }

    /**
     * @dev Create a dispute
     */
    function createDispute(
        uint256 _jobId,
        address _client,
        address _worker,
        string memory _category,
        uint256 _amount
    ) external payable onlyMarketplace returns (uint256) {
        require(msg.value >= ARBITRATION_FEE, "Insufficient arbitration fee");
        require(
            jurorsByCategory[_category].length >= INITIAL_JUROR_COUNT,
            "Not enough jurors"
        );

        disputeCounter++;
        Dispute storage dispute = disputes[disputeCounter];
        dispute.disputeId = disputeCounter;
        dispute.jobId = _jobId;
        dispute.client = _client;
        dispute.worker = _worker;
        dispute.category = _category;
        dispute.amount = _amount;
        dispute.isActive = true;
        dispute.jurorCount = INITIAL_JUROR_COUNT;
        dispute.arbitrationFeePaid = msg.value;

        dispute.isActive = true;
        dispute.jurorCount = INITIAL_JUROR_COUNT;
        dispute.arbitrationFeePaid = msg.value;
        dispute.createdAt = block.timestamp;
        dispute.commitPeriodEnd = block.timestamp + 3 days;
        dispute.revealPeriodEnd = block.timestamp + 6 days;

        // Select initial jurors
        _selectJurors(disputeCounter, INITIAL_JUROR_COUNT);

        emit DisputeCreated(disputeCounter, _jobId, _category);
        return disputeCounter;
    }

    /**
     * @dev Submit evidence for a dispute
     */
    function submitEvidence(
        uint256 _disputeId,
        string memory _evidenceHash
    ) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isActive, "Dispute not active");
        require(
            msg.sender == dispute.client || msg.sender == dispute.worker,
            "Only parties can submit"
        );
        require(
            block.timestamp < dispute.commitPeriodEnd,
            "Evidence period over"
        );

        dispute.evidence.push(_evidenceHash);
        emit EvidenceSubmitted(_disputeId, msg.sender, _evidenceHash);
    }

    /**
     * @dev Commit a vote hash (Step 1)
     * Hash = keccak256(abi.encodePacked(voteForClient, salt, jurorAddress))
     */
    function commitVote(uint256 _disputeId, bytes32 _commitHash) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isActive, "Dispute not active");
        require(
            block.timestamp < dispute.commitPeriodEnd,
            "Commit period over"
        );
        require(!dispute.hasCommitted[msg.sender], "Already committed");
        require(_isSelectedJuror(_disputeId, msg.sender), "Not selected juror");
        require(jurors[msg.sender].isStaked, "Not a staked juror");

        dispute.commitHashes[msg.sender] = _commitHash;
        dispute.hasCommitted[msg.sender] = true;

        emit VoteCommitted(_disputeId, msg.sender);
    }

    /**
     * @dev Reveal a vote (Step 2)
     */
    function revealVote(
        uint256 _disputeId,
        bool _voteForClient,
        string memory _salt
    ) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isActive, "Dispute not active");
        require(
            block.timestamp >= dispute.commitPeriodEnd,
            "Reveal period not started"
        );
        require(
            block.timestamp < dispute.revealPeriodEnd,
            "Reveal period over"
        );
        require(dispute.hasCommitted[msg.sender], "No commit found");
        require(!dispute.hasRevealed[msg.sender], "Already revealed");

        // Verify hash
        bytes32 verifyHash = keccak256(
            abi.encodePacked(_voteForClient, _salt, msg.sender)
        );
        require(
            verifyHash == dispute.commitHashes[msg.sender],
            "Hash mismatch"
        );

        dispute.hasRevealed[msg.sender] = true;
        dispute.votedForClient[msg.sender] = _voteForClient;

        if (_voteForClient) {
            dispute.votesForClient++;
        } else {
            dispute.votesForWorker++;
        }

        jurors[msg.sender].casesVoted++;

        emit VoteRevealed(_disputeId, msg.sender, _voteForClient);

        // Check if we can close early? OR wait for end.
        // For reveal phase, usually wait for time end is standard, or if all committed have revealed.
        // Let's settle when reveal period ends or trigger manually.
        // For simplicity here, we add a resolve function or auto-check if all Selected revealed.
    }

    /**
     * @dev Finalize dispute after reveal period
     */
    function finalizeDispute(uint256 _disputeId) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isActive, "Dispute not active");
        require(
            block.timestamp >= dispute.revealPeriodEnd,
            "Reveal period not over"
        );

        _resolveDispute(_disputeId);
    }

    /**
     * @dev Appeal a dispute decision
     */
    function appealDispute(uint256 _disputeId) external payable {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isResolved, "Dispute not resolved yet");
        require(
            msg.sender == dispute.client || msg.sender == dispute.worker,
            "Only parties can appeal"
        );
        require(msg.value >= ARBITRATION_FEE, "Insufficient appeal fee");

        // Reopen dispute with more jurors
        dispute.isActive = true;
        dispute.isResolved = false;
        dispute.votesForClient = 0;
        dispute.votesForWorker = 0;
        dispute.appealCount++;
        dispute.jurorCount += APPEAL_JUROR_INCREMENT;
        dispute.arbitrationFeePaid += msg.value;

        dispute.commitPeriodEnd = block.timestamp + 3 days;
        dispute.revealPeriodEnd = block.timestamp + 6 days;

        // Reset votes
        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            dispute.hasCommitted[dispute.selectedJurors[i]] = false;
            dispute.hasRevealed[dispute.selectedJurors[i]] = false;
        }

        // Select additional jurors
        _selectJurors(_disputeId, APPEAL_JUROR_INCREMENT);

        emit DisputeAppealed(_disputeId, dispute.jurorCount);
    }

    /**
     * @dev Get dispute result
     */
    function getDisputeResult(
        uint256 _disputeId
    ) external view returns (bool isResolved, bool clientWon) {
        Dispute storage dispute = disputes[_disputeId];
        return (
            dispute.isResolved,
            dispute.votesForClient > dispute.votesForWorker
        );
    }

    /**
     * @dev Internal: Select jurors for a dispute
     */
    function _selectJurors(uint256 _disputeId, uint256 _count) internal {
        Dispute storage dispute = disputes[_disputeId];
        address[] storage categoryJurors = jurorsByCategory[dispute.category];

        require(categoryJurors.length >= _count, "Not enough jurors");

        // Simple pseudo-random selection (in production, use Chainlink VRF)
        uint256 startIndex = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, _disputeId)
            )
        ) % categoryJurors.length;

        uint256 selected = 0;
        uint256 index = startIndex;

        while (selected < _count && selected < categoryJurors.length) {
            address juror = categoryJurors[index];
            if (
                jurors[juror].isStaked && !_isSelectedJuror(_disputeId, juror)
            ) {
                dispute.selectedJurors.push(juror);
                emit JurorSelected(_disputeId, juror);
                selected++;
            }
            index = (index + 1) % categoryJurors.length;

            // Prevent infinite loop
            if (index == startIndex && selected < _count) {
                break;
            }
        }
    }

    /**
     * @dev Internal: Resolve dispute and distribute rewards
     */
    function _resolveDispute(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        dispute.isActive = false;
        dispute.isResolved = true;

        bool clientWon = dispute.votesForClient > dispute.votesForWorker;
        uint256 majorityVotes = clientWon
            ? dispute.votesForClient
            : dispute.votesForWorker;

        emit DisputeResolved(_disputeId, clientWon, majorityVotes);

        // Distribute rewards to majority voters
        _distributeRewards(_disputeId, clientWon);
    }

    /**
     * @dev Internal: Distribute rewards to winning jurors
     */
    function _distributeRewards(uint256 _disputeId, bool _clientWon) internal {
        Dispute storage dispute = disputes[_disputeId];

        // First pass: count winners and losers, update stats
        uint256 winnerCount;
        uint256 loserCount;

        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            address juror = dispute.selectedJurors[i];
            if (dispute.hasRevealed[juror]) {
                if (dispute.votedForClient[juror] == _clientWon) {
                    winnerCount++;
                    jurors[juror].correctVotes++;
                } else {
                    loserCount++;
                }
            } else {
                // Penalize for not revealing?
                // Typically yes, treated as losing or separate penalty.
                // For MVP treating non-reveal as neutral/ignored.
            }
        }

        if (winnerCount == 0) return;

        // Calculate total reward
        uint256 slashedAmount = _slashLosers(_disputeId, _clientWon);
        uint256 totalReward = dispute.arbitrationFeePaid + slashedAmount;
        uint256 rewardPerJuror = totalReward / winnerCount;

        // Distribute to winners
        address[] memory winners = new address[](winnerCount);
        uint256 winnerIndex;

        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            address juror = dispute.selectedJurors[i];
            if (
                dispute.hasRevealed[juror] &&
                dispute.votedForClient[juror] == _clientWon
            ) {
                jurors[juror].stakedAmount += rewardPerJuror;
                winners[winnerIndex] = juror;
                winnerIndex++;
            }
        }

        emit RewardsDistributed(_disputeId, winners, rewardPerJuror);
    }

    /**
     * @dev Internal: Slash losing jurors
     */
    function _slashLosers(
        uint256 _disputeId,
        bool _clientWon
    ) internal returns (uint256) {
        Dispute storage dispute = disputes[_disputeId];
        uint256 totalSlashed;

        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            address juror = dispute.selectedJurors[i];
            if (
                dispute.hasRevealed[juror] &&
                dispute.votedForClient[juror] != _clientWon
            ) {
                uint256 slashAmount = jurors[juror].stakedAmount / 10;
                jurors[juror].stakedAmount -= slashAmount;
                totalSlashed += slashAmount;
            }
        }

        return totalSlashed;
    }

    /**
     * @dev Internal: Check if address is a selected juror
     */
    function _isSelectedJuror(
        uint256 _disputeId,
        address _juror
    ) internal view returns (bool) {
        Dispute storage dispute = disputes[_disputeId];
        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            if (dispute.selectedJurors[i] == _juror) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Internal: Remove juror from category
     */
    function _removeJurorFromCategory(
        address _juror,
        string memory _category
    ) internal {
        address[] storage categoryJurors = jurorsByCategory[_category];
        for (uint256 i = 0; i < categoryJurors.length; i++) {
            if (categoryJurors[i] == _juror) {
                categoryJurors[i] = categoryJurors[categoryJurors.length - 1];
                categoryJurors.pop();
                break;
            }
        }
    }

    /**
     * @dev Get selected jurors for a dispute
     */
    function getSelectedJurors(
        uint256 _disputeId
    ) external view returns (address[] memory) {
        return disputes[_disputeId].selectedJurors;
    }

    /**
     * @dev Get juror categories
     */
    function getJurorCategories(
        address _juror
    ) external view returns (string[] memory) {
        return jurors[_juror].categories;
    }

    /**
     * @dev Get jurors by category count
     */
    function getJurorCountByCategory(
        string memory _category
    ) external view returns (uint256) {
        return jurorsByCategory[_category].length;
    }

    /**
     * @dev Get evidence count
     */
    function getEvidenceCount(
        uint256 _disputeId
    ) external view returns (uint256) {
        return disputes[_disputeId].evidence.length;
    }

    /**
     * @dev Get evidence item
     */
    function getEvidence(
        uint256 _disputeId,
        uint256 _index
    ) external view returns (string memory) {
        return disputes[_disputeId].evidence[_index];
    }
}
