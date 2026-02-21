// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SortitionSumTreeFactory.sol";

/**
 * @title IRandomnessOracle
 * @dev Interface for quantum randomness oracle (API3 QRNG or custom ANU oracle)
 */
interface IRandomnessOracle {
    function requestRandomness() external returns (bytes32 requestId);
    function getRandomNumber(bytes32 requestId) external view returns (uint256);
    function isRandomNumberReady(bytes32 requestId) external view returns (bool);
}

/**
 * @title Arbitration
 * @dev Handles staked juror system for dispute resolution
 * Implements Kleros-inspired arbitration mechanism with quantum randomness
 */
contract Arbitration is ReentrancyGuard {
    using SortitionSumTreeFactory for SortitionSumTreeFactory.SortitionSumTrees;
    
    // USDC token on Ethereum mainnet (6 decimals)
    IERC20 public immutable usdc;
    address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    address public marketplace;
    address public treasury; // For trapped funds in edge cases
    IRandomnessOracle public randomnessOracle;

    // Sortition trees for each category
    SortitionSumTreeFactory.SortitionSumTrees internal sortitionTrees;
    uint256 private constant TREE_K = 5; // 5 children per node for balanced tree

    // USDC amounts (6 decimals: 1 USDC = 1_000_000)
    uint256 public constant STAKE_AMOUNT = 100 * 10 ** 6; // 100 USDC
    uint256 public constant ARBITRATION_FEE = 10 * 10 ** 6; // 10 USDC
    uint256 public constant STAKE_LOCK_PER_DISPUTE = 20 * 10 ** 6; // 20 USDC locked per dispute
    uint256 public constant INITIAL_JUROR_COUNT = 3;
    uint256 public constant APPEAL_JUROR_INCREMENT = 2;
    uint256 public constant MAX_JURORS_PER_DISPUTE = 21; // Gas limit protection
    uint256 public constant MAX_CATEGORIES = 10; // Max categories per juror to prevent gas issues
    uint256 public constant SLASH_PERCENTAGE = 10; // 10% slash for losers/non-revealers
    uint256 public constant REVEAL_QUORUM_PERCENTAGE = 67; // 67% must reveal for valid round
    uint256 public constant APPEAL_PERIOD = 3 days; // Time window to appeal after resolution
    uint256 public constant EVIDENCE_PERIOD = 2 days; // Evidence submission period before voting

    struct Juror {
        bool isStaked;
        bool isEligible; // False if stake dropped below locked amount
        uint256 stakedAmount;
        uint256 lockedStake; // Amount locked across all active disputes
        uint256 casesVoted;
        uint256 correctVotes;
        uint256 activeDisputeCount; // Track active disputes
        uint256[] categories; // Track all categories juror is in
        mapping(uint256 => bool) inCategory; // categoryId => bool
        mapping(uint256 => bool) isSelectedForDispute; // disputeId => bool (O(1) lookup)
    }

    struct Dispute {
        uint256 disputeId;
        uint256 jobId;
        address client;
        address worker;
        uint256 categoryId;
        uint256 amount;
        bool isActive;
        bool isResolved;
        uint256 votesForClient;
        uint256 votesForWorker;
        uint256 jurorCount;
        uint256 appealCount;
        uint256 revealCount; // Track number of reveals
        address[] selectedJurors;
        mapping(address => bytes32) commitHashes;
        mapping(address => bool) hasCommitted;
        mapping(address => bool) hasRevealed;
        mapping(address => bool) votedForClient;
        mapping(address => bool) hasClaimed; // Pull-based rewards
        mapping(address => uint256) jurorStakeSnapshot; // Stake at selection time
        mapping(address => uint256) pendingSlash; // Pending slash amounts (not yet applied)
        uint256 arbitrationFeePaid;
        uint256 totalSlashed;
        uint256 winnerCount;
        bool clientWon;
        uint256 rewardPerWinner;
        string[] evidence;
        uint256 createdAt;
        uint256 evidencePeriodEnd; // Evidence submission deadline
        uint256 commitPeriodEnd;
        uint256 revealPeriodEnd;
        uint256 appealPeriodEnd; // Time window to appeal after resolution
        bytes32 randomnessRequestId;
        bool jurorSelectionPending;
    }

    mapping(address => Juror) public jurors;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => bool) public validCategories; // categoryId => exists
    mapping(uint256 => string) public categoryNames; // categoryId => name
    uint256 public disputeCounter;
    uint256 public categoryCounter;

    event CategoryAdded(uint256 indexed categoryId, string name);
    event JurorStaked(
        address indexed juror,
        uint256 amount,
        uint256[] categoryIds
    );
    event JurorUnstaked(address indexed juror, uint256 amount);
    event JurorStakeAdded(address indexed juror, uint256 amount, uint256 newTotal);
    event JurorRewardsWithdrawn(address indexed juror, uint256 amount);
    event JurorEligibilityRestored(address indexed juror);
    event TreasuryFundsDeposited(uint256 indexed disputeId, uint256 amount);
    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        uint256 categoryId
    );
    event RewardClaimed(
        uint256 indexed disputeId,
        address indexed juror,
        uint256 amount
    );
    event JurorSlashed(
        uint256 indexed disputeId,
        address indexed juror,
        uint256 amount,
        string reason
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
    event DisputeRetried(
        uint256 indexed disputeId,
        string reason,
        uint256 newJurorCount
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
    event RandomnessRequested(uint256 indexed disputeId, bytes32 requestId);
    event JurorSelectionCompleted(uint256 indexed disputeId, uint256 jurorCount);

    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "Only marketplace");
        _;
    }

    constructor(address _randomnessOracle) {
        usdc = IERC20(USDC_ADDRESS);
        randomnessOracle = IRandomnessOracle(_randomnessOracle);
        treasury = msg.sender; // Initially set to deployer, can be changed
    }

    /**
     * @dev Set marketplace address (only once)
     */
    function setMarketplace(address _marketplace) external {
        require(marketplace == address(0), "Marketplace already set");
        marketplace = _marketplace;
    }

    /**
     * @dev Update treasury address (admin function)
     */
    function setTreasury(address _treasury) external {
        require(marketplace == address(0) || msg.sender == marketplace, "Not authorized");
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    /**
     * @dev Update randomness oracle address (admin function)
     */
    function setRandomnessOracle(address _oracle) external {
        require(marketplace == address(0) || msg.sender == marketplace, "Not authorized");
        randomnessOracle = IRandomnessOracle(_oracle);
    }

    /**
     * @dev Add a new category (admin only)
     */
    function addCategory(string memory _name) external {
        require(marketplace == address(0) || msg.sender == marketplace, "Not authorized");
        categoryCounter++;
        validCategories[categoryCounter] = true;
        categoryNames[categoryCounter] = _name;
        
        // Create sortition tree for this category
        bytes32 treeKey = bytes32(categoryCounter);
        sortitionTrees.createTree(treeKey, TREE_K);
        
        emit CategoryAdded(categoryCounter, _name);
    }

    /**
     * @dev Stake tokens to become a juror
     */
    function stakeAsJuror(uint256[] memory _categoryIds) external nonReentrant {
        require(!jurors[msg.sender].isStaked, "Already staked");
        require(_categoryIds.length > 0, "Must specify categories");
        require(_categoryIds.length <= MAX_CATEGORIES, "Too many categories");
        require(
            usdc.transferFrom(
                msg.sender,
                address(this),
                STAKE_AMOUNT
            ),
            "Stake transfer failed"
        );

        Juror storage juror = jurors[msg.sender];
        juror.isStaked = true;
        juror.isEligible = true; // Initially eligible for selection
        juror.stakedAmount = STAKE_AMOUNT;
        juror.lockedStake = 0;
        juror.casesVoted = 0;
        juror.correctVotes = 0;
        juror.activeDisputeCount = 0;

        // Add to category sortition trees and track categories
        bytes32 jurorID = bytes32(uint256(uint160(msg.sender)));
        for (uint256 i = 0; i < _categoryIds.length; i++) {
            require(validCategories[_categoryIds[i]], "Invalid category");
            require(!juror.inCategory[_categoryIds[i]], "Category already added");
            
            juror.inCategory[_categoryIds[i]] = true;
            juror.categories.push(_categoryIds[i]);
            
            // Add to sortition tree with available stake as weight
            bytes32 treeKey = bytes32(_categoryIds[i]);
            uint256 availableStake = STAKE_AMOUNT; // Initially all stake is available
            sortitionTrees.set(treeKey, availableStake, jurorID);
        }

        emit JurorStaked(msg.sender, STAKE_AMOUNT, _categoryIds);
    }

    /**
     * @dev Unstake tokens and stop being a juror
     */
    function unstake() external nonReentrant {
        Juror storage juror = jurors[msg.sender];
        require(juror.isStaked, "Not staked");
        require(juror.activeDisputeCount == 0, "Active in disputes");
        require(juror.lockedStake == 0, "Stake still locked");

        uint256 amount = juror.stakedAmount;
        uint256[] memory categories = juror.categories;

        // Remove from all category sortition trees (O(log n) per category)
        bytes32 jurorID = bytes32(uint256(uint160(msg.sender)));
        for (uint256 i = 0; i < categories.length; i++) {
            bytes32 treeKey = bytes32(categories[i]);
            sortitionTrees.set(treeKey, 0, jurorID); // Setting to 0 removes from tree
        }

        delete jurors[msg.sender];

        require(
            usdc.transfer(msg.sender, amount),
            "Unstake transfer failed"
        );

        emit JurorUnstaked(msg.sender, amount);
    }

    /**
     * @dev Add more stake to restore eligibility or increase selection weight
     */
    function addStake(uint256 _amount) external nonReentrant {
        Juror storage juror = jurors[msg.sender];
        require(juror.isStaked, "Not staked");
        require(_amount > 0, "Amount must be positive");
        
        require(
            usdc.transferFrom(msg.sender, address(this), _amount),
            "Stake transfer failed"
        );
        
        juror.stakedAmount += _amount;
        
        // Restore eligibility if stake now covers locked amount
        if (!juror.isEligible && juror.stakedAmount >= juror.lockedStake) {
            juror.isEligible = true;
            emit JurorEligibilityRestored(msg.sender);
        }
        
        // Update weight in sortition trees
        _updateJurorWeight(msg.sender);
        
        emit JurorStakeAdded(msg.sender, _amount, juror.stakedAmount);
    }

    /**
     * @dev Withdraw rewards without unstaking
     * Allows jurors to extract earned rewards while remaining active
     */
    function withdrawRewards(uint256 _amount) external nonReentrant {
        Juror storage juror = jurors[msg.sender];
        require(juror.isStaked, "Not staked");
        require(_amount > 0, "Amount must be positive");
        
        // Ensure remaining stake covers locked amount
        require(
            juror.stakedAmount - _amount >= juror.lockedStake,
            "Cannot withdraw below locked stake"
        );
        
        // Ensure remaining stake is at least STAKE_AMOUNT to maintain juror status
        require(
            juror.stakedAmount - _amount >= STAKE_AMOUNT,
            "Must maintain minimum stake"
        );
        
        juror.stakedAmount -= _amount;
        
        // Update weight in sortition trees
        _updateJurorWeight(msg.sender);
        
        require(
            usdc.transfer(msg.sender, _amount),
            "Withdrawal transfer failed"
        );
        
        emit JurorRewardsWithdrawn(msg.sender, _amount);
    }

    /**
     * @dev Update juror's weight in sortition trees when stake changes
     */
    function _updateJurorWeight(address _juror) internal {
        Juror storage juror = jurors[_juror];
        if (!juror.isStaked) return;
        if (!juror.isEligible) return; // Don't update weight if juror is ineligible
        
        // Safely handle case where slashing reduced stakedAmount below lockedStake
        uint256 availableStake = juror.stakedAmount >= juror.lockedStake
            ? juror.stakedAmount - juror.lockedStake
            : 0;
        bytes32 jurorID = bytes32(uint256(uint160(_juror)));
        
        // Update weight in all categories
        for (uint256 i = 0; i < juror.categories.length; i++) {
            bytes32 treeKey = bytes32(juror.categories[i]);
            sortitionTrees.set(treeKey, availableStake, jurorID);
        }
    }

    /**
     * @dev Create a dispute
     */
    function createDispute(
        uint256 _jobId,
        address _client,
        address _worker,
        uint256 _categoryId,
        uint256 _amount
    ) external onlyMarketplace returns (uint256) {
        require(validCategories[_categoryId], "Invalid category");
        
        // Check if sortition tree has enough stake
        bytes32 treeKey = bytes32(_categoryId);
        require(sortitionTrees.sortitionSumTrees[treeKey].nodes.length > 1, "No jurors in category");
        require(sortitionTrees.sortitionSumTrees[treeKey].nodes[0] >= STAKE_LOCK_PER_DISPUTE * INITIAL_JUROR_COUNT, "Not enough available stake");

        // Require oracle to be available - no predictable fallback
        require(address(randomnessOracle) != address(0), "Randomness oracle not available");

        // Transfer arbitration fee from marketplace (marketplace should have received it from disputing party)
        require(
            usdc.transferFrom(marketplace, address(this), ARBITRATION_FEE),
            "Arbitration fee transfer failed"
        );

        disputeCounter++;
        Dispute storage dispute = disputes[disputeCounter];
        dispute.disputeId = disputeCounter;
        dispute.jobId = _jobId;
        dispute.client = _client;
        dispute.worker = _worker;
        dispute.categoryId = _categoryId;
        dispute.amount = _amount;
        dispute.isActive = true;
        dispute.jurorCount = INITIAL_JUROR_COUNT;
        dispute.arbitrationFeePaid = ARBITRATION_FEE;
        dispute.createdAt = block.timestamp;
        dispute.evidencePeriodEnd = block.timestamp + EVIDENCE_PERIOD;
        dispute.commitPeriodEnd = block.timestamp + EVIDENCE_PERIOD + 3 days;
        dispute.revealPeriodEnd = block.timestamp + EVIDENCE_PERIOD + 6 days;

        // Request randomness for juror selection (oracle required)
        bytes32 requestId = randomnessOracle.requestRandomness();
        dispute.randomnessRequestId = requestId;
        dispute.jurorSelectionPending = true;
        emit RandomnessRequested(disputeCounter, requestId);

        emit DisputeCreated(disputeCounter, _jobId, _categoryId);
        return disputeCounter;
    }

    /**
     * @dev Complete juror selection once randomness is available
     * Only callable by marketplace or dispute parties to prevent MEV manipulation
     */
    function completeJurorSelection(uint256 _disputeId) external nonReentrant {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.jurorSelectionPending, "Selection not pending");
        require(
            msg.sender == marketplace || 
            msg.sender == dispute.client || 
            msg.sender == dispute.worker,
            "Not authorized"
        );
        require(
            randomnessOracle.isRandomNumberReady(dispute.randomnessRequestId),
            "Randomness not ready"
        );

        uint256 randomNumber = randomnessOracle.getRandomNumber(
            dispute.randomnessRequestId
        );
        _selectJurorsWithRandomness(_disputeId, dispute.jurorCount, randomNumber);
        
        dispute.jurorSelectionPending = false;
        emit JurorSelectionCompleted(_disputeId, dispute.jurorCount);
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
            block.timestamp < dispute.evidencePeriodEnd,
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
        require(!dispute.jurorSelectionPending, "Juror selection not completed");
        require(
            block.timestamp >= dispute.evidencePeriodEnd,
            "Evidence period not ended"
        );
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
        dispute.revealCount++;

        if (_voteForClient) {
            dispute.votesForClient++;
        } else {
            dispute.votesForWorker++;
        }

        jurors[msg.sender].casesVoted++;

        emit VoteRevealed(_disputeId, msg.sender, _voteForClient);

        // Note: Early finalization removed to prevent revert on tie
        // Use finalizeDispute() or retryDisputeRound() after reveal period ends
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
     * @dev Retry dispute round due to insufficient reveals or tie
     * Slashes non-revealers and selects new jurors
     */
    function retryDisputeRound(uint256 _disputeId) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isActive, "Dispute not active");
        require(
            block.timestamp >= dispute.revealPeriodEnd,
            "Reveal period not over"
        );

        // Use ceiling division for quorum
        uint256 requiredReveals = (dispute.selectedJurors.length * REVEAL_QUORUM_PERCENTAGE + 99) / 100;
        bool quorumNotMet = dispute.revealCount < requiredReveals;
        bool isTie = dispute.votesForClient == dispute.votesForWorker && dispute.revealCount > 0;

        require(quorumNotMet || isTie, "Round is valid, use finalizeDispute");

        // Apply slashing immediately to non-revealers and add to arbitration fee pool
        uint256 totalSlashedInRetry = 0;
        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            address juror = dispute.selectedJurors[i];
            if (!dispute.hasRevealed[juror]) {
                uint256 snapshotStake = dispute.jurorStakeSnapshot[juror];
                uint256 slashAmount = snapshotStake * SLASH_PERCENTAGE / 100;
                // Ensure we don't slash more than current stake
                if (slashAmount > jurors[juror].stakedAmount) {
                    slashAmount = jurors[juror].stakedAmount;
                }
                jurors[juror].stakedAmount -= slashAmount;
                totalSlashedInRetry += slashAmount;
                
                // Check stake invariant
                _enforceStakeInvariant(juror);
                
                emit JurorSlashed(_disputeId, juror, slashAmount, "Non-reveal in retry");
            }
            
            // Auto-decrement activeDisputeCount and unlock stake for all jurors from this round
            jurors[juror].activeDisputeCount--;
            jurors[juror].lockedStake -= STAKE_LOCK_PER_DISPUTE;
            
            // Update sortition tree weight (available stake increased)
            _updateJurorWeight(juror);
        }
        
        // Add slashed funds to arbitration fee pool for new round
        dispute.arbitrationFeePaid += totalSlashedInRetry;

        // Clear ALL round data to ensure round isolation
        uint256 existingJurorCount = dispute.selectedJurors.length;
        for (uint256 i = 0; i < existingJurorCount; i++) {
            address juror = dispute.selectedJurors[i];
            delete dispute.commitHashes[juror];
            delete dispute.hasCommitted[juror];
            delete dispute.hasRevealed[juror]; // MUST reset for round isolation
            delete dispute.votedForClient[juror]; // MUST reset for round isolation
            delete dispute.hasClaimed[juror]; // Reset claim status for new round
            delete dispute.jurorStakeSnapshot[juror]; // Will be re-snapshotted
            delete dispute.pendingSlash[juror]; // Clear any pending slashes
        }

        // Clear the entire jury panel - retry gets completely new jury
        delete dispute.selectedJurors;

        // Reset vote counts
        dispute.votesForClient = 0;
        dispute.votesForWorker = 0;
        dispute.revealCount = 0;
        dispute.appealCount++;

        // Keep same jury size for retry (no fee paid, so no reward dilution)
        // Only appeals (which charge fees) should increase jury size
        uint256 newJurorCount = dispute.jurorCount; // Same size, different jurors

        // Extend periods with evidence period
        dispute.evidencePeriodEnd = block.timestamp + EVIDENCE_PERIOD;
        dispute.commitPeriodEnd = block.timestamp + EVIDENCE_PERIOD + 3 days;
        dispute.revealPeriodEnd = block.timestamp + EVIDENCE_PERIOD + 6 days;

        // Select additional jurors using oracle randomness (required)
        require(address(randomnessOracle) != address(0), "Randomness oracle not available");
        bytes32 requestId = randomnessOracle.requestRandomness();
        dispute.randomnessRequestId = requestId;
        dispute.jurorSelectionPending = true;
        emit RandomnessRequested(_disputeId, requestId);

        string memory reason = quorumNotMet ? "Quorum not met" : "Tie vote";
        emit DisputeRetried(_disputeId, reason, newJurorCount);
    }

    /**
     * @dev Appeal a dispute decision
     */
    function appealDispute(uint256 _disputeId) external {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isResolved, "Dispute not resolved yet");
        require(
            block.timestamp <= dispute.appealPeriodEnd,
            "Appeal period expired"
        );
        require(
            msg.sender == dispute.client || msg.sender == dispute.worker,
            "Only parties can appeal"
        );

        uint256 newJurorCount = dispute.jurorCount + APPEAL_JUROR_INCREMENT;
        require(newJurorCount <= MAX_JURORS_PER_DISPUTE, "Max jurors exceeded");

        // Scale appeal fee dynamically: fee proportional to new juror count
        // This maintains economic incentives for jurors in later appeal rounds
        uint256 appealFee = (ARBITRATION_FEE * newJurorCount) / INITIAL_JUROR_COUNT;
        
        // Transfer scaled appeal fee from appellant
        require(
            usdc.transferFrom(msg.sender, address(this), appealFee),
            "Appeal fee transfer failed"
        );

        // Unlock stakes for old jurors since appeal cancels the resolution
        uint256 existingJurorCount = dispute.selectedJurors.length;
        for (uint256 i = 0; i < existingJurorCount; i++) {
            address juror = dispute.selectedJurors[i];
            
            // Unlock their stake now that appeal is filed
            jurors[juror].activeDisputeCount--;
            jurors[juror].lockedStake -= STAKE_LOCK_PER_DISPUTE;
            _updateJurorWeight(juror);
            
            // Clear dispute data
            delete dispute.commitHashes[juror];
            delete dispute.hasCommitted[juror];
            delete dispute.hasRevealed[juror];
            delete dispute.votedForClient[juror];
            delete dispute.hasClaimed[juror];
            delete dispute.jurorStakeSnapshot[juror];
            delete dispute.pendingSlash[juror]; // Clear pending slashes since appeal resets
        }

        // Clear the entire jury panel - appeal gets completely new jury
        delete dispute.selectedJurors;

        // Reopen dispute with entirely new jury
        dispute.isActive = true;
        dispute.isResolved = false;
        dispute.votesForClient = 0;
        dispute.votesForWorker = 0;
        dispute.revealCount = 0;
        dispute.appealCount++;
        dispute.jurorCount = newJurorCount;
        dispute.arbitrationFeePaid += appealFee; // Use scaled appeal fee
        dispute.totalSlashed = 0;
        dispute.winnerCount = 0;
        dispute.rewardPerWinner = 0;

        dispute.evidencePeriodEnd = block.timestamp + EVIDENCE_PERIOD;
        dispute.commitPeriodEnd = block.timestamp + EVIDENCE_PERIOD + 3 days;
        dispute.revealPeriodEnd = block.timestamp + EVIDENCE_PERIOD + 6 days;
        dispute.appealPeriodEnd = 0; // Reset appeal period

        // Select entirely new jury panel using oracle randomness (required)
        require(address(randomnessOracle) != address(0), "Randomness oracle not available");
        bytes32 requestId = randomnessOracle.requestRandomness();
        dispute.randomnessRequestId = requestId;
        dispute.jurorSelectionPending = true;
        emit RandomnessRequested(_disputeId, requestId);

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
     * @dev Internal: Select jurors using quantum randomness with sortition tree (O(k * log n))
     * Probability of selection is proportional to available stake (Kleros-style sortition)
     * Implements retry logic to skip ineligible jurors
     */
    function _selectJurorsWithRandomness(
        uint256 _disputeId,
        uint256 _count,
        uint256 _randomNumber
    ) internal {
        Dispute storage dispute = disputes[_disputeId];
        bytes32 treeKey = bytes32(dispute.categoryId);

        require(dispute.selectedJurors.length + _count <= MAX_JURORS_PER_DISPUTE, "Max jurors exceeded");

        // Get total stake in tree for modulo operation
        uint256 totalStake = sortitionTrees.sortitionSumTrees[treeKey].nodes[0];
        require(totalStake > 0, "No stake in category");

        // Track selected jurors to restore weights after selection
        address[] memory selectedInThisRound = new address[](_count);
        uint256 selectedCount = 0;
        uint256 seed = _randomNumber;
        uint256 attempts = 0;
        uint256 maxAttempts = _count * 10; // Gas limit protection

        // Use sortition tree to draw jurors with retry logic
        while (selectedCount < _count && attempts < maxAttempts) {
            attempts++;
            
            // Generate random number and apply modulo to fit within total stake
            uint256 randomDraw = uint256(
                keccak256(abi.encodePacked(seed, selectedCount, _disputeId))
            ) % totalStake;
            
            // Draw from sortition tree
            bytes32 jurorID = sortitionTrees.draw(treeKey, randomDraw);
            address selectedJuror = address(uint160(uint256(jurorID)));
            
            // Check if juror is eligible
            if (!jurors[selectedJuror].isStaked || 
                !jurors[selectedJuror].isEligible ||
                _isSelectedJuror(_disputeId, selectedJuror)) {
                // Skip this juror and try again with new seed
                seed = uint256(keccak256(abi.encodePacked(seed, selectedJuror)));
                continue;
            }
            
            uint256 availableStake = jurors[selectedJuror].stakedAmount - jurors[selectedJuror].lockedStake;
            if (availableStake < STAKE_LOCK_PER_DISPUTE) {
                // Skip this juror and try again with new seed
                seed = uint256(keccak256(abi.encodePacked(seed, selectedJuror)));
                continue;
            }
            
            // Valid juror found - add to dispute and snapshot stake
            dispute.selectedJurors.push(selectedJuror);
            dispute.jurorStakeSnapshot[selectedJuror] = jurors[selectedJuror].stakedAmount;
            
            // Mark juror as selected for this dispute (O(1) lookup)
            jurors[selectedJuror].isSelectedForDispute[_disputeId] = true;
            
            // Lock stake for this dispute
            jurors[selectedJuror].lockedStake += STAKE_LOCK_PER_DISPUTE;
            jurors[selectedJuror].activeDisputeCount++;
            
            // Track for weight update
            selectedInThisRound[selectedCount] = selectedJuror;
            selectedCount++;
            
            // Temporarily set weight to 0 to prevent re-selection in this round
            bytes32 tempJurorID = bytes32(uint256(uint160(selectedJuror)));
            for (uint256 j = 0; j < jurors[selectedJuror].categories.length; j++) {
                bytes32 tempTreeKey = bytes32(jurors[selectedJuror].categories[j]);
                sortitionTrees.set(tempTreeKey, 0, tempJurorID);
            }
            
            emit JurorSelected(_disputeId, selectedJuror);
            
            // Update seed for next iteration
            seed = uint256(keccak256(abi.encodePacked(seed, selectedJuror)));
        }
        
        require(selectedCount == _count, "Could not select enough jurors");

        // Restore weights for all selected jurors with their new locked stake
        for (uint256 i = 0; i < selectedCount; i++) {
            _updateJurorWeight(selectedInThisRound[i]);
        }
    }



    /**
     * @dev Internal: Resolve dispute and calculate rewards (no loops for distribution)
     */
    function _resolveDispute(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        
        // Use ceiling division for quorum
        uint256 requiredReveals = (dispute.selectedJurors.length * REVEAL_QUORUM_PERCENTAGE + 99) / 100;
        require(dispute.revealCount >= requiredReveals, "Insufficient reveals, use retryDisputeRound");
        
        // Check for tie
        require(
            dispute.votesForClient != dispute.votesForWorker,
            "Tie vote, use retryDisputeRound"
        );

        dispute.isActive = false;
        dispute.isResolved = true;
        dispute.appealPeriodEnd = block.timestamp + APPEAL_PERIOD; // Set appeal window

        dispute.clientWon = dispute.votesForClient > dispute.votesForWorker;
        uint256 majorityVotes = dispute.clientWon
            ? dispute.votesForClient
            : dispute.votesForWorker;

        // Record pending slashes (don't apply yet - wait for appeal period)
        uint256 totalSlashed = _applySlashing(_disputeId);
        dispute.totalSlashed = totalSlashed;
        dispute.winnerCount = dispute.clientWon ? dispute.votesForClient : dispute.votesForWorker;
        
        uint256 totalReward = dispute.arbitrationFeePaid + totalSlashed;
        
        if (dispute.winnerCount > 0) {
            dispute.rewardPerWinner = totalReward / dispute.winnerCount;
        } else {
            // Edge case: Zero winners - send funds to treasury
            require(treasury != address(0), "Treasury not set");
            require(
                usdc.transfer(treasury, totalReward),
                "Treasury transfer failed"
            );
            emit TreasuryFundsDeposited(_disputeId, totalReward);
        }

        // DO NOT unlock stakes here - keep jurors locked until appeal period ends
        // This prevents slash evasion where jurors unstake before slashing is applied
        // Stakes will be unlocked when rewards are claimed (after appeal period)

        emit DisputeResolved(_disputeId, dispute.clientWon, majorityVotes);
    }

    /**
     * @dev Apply slashing immediately to all losers and non-revealers
     * This prevents insolvency by ensuring slashed funds are available for rewards
     */
    function _applySlashing(uint256 _disputeId) internal returns (uint256) {
        Dispute storage dispute = disputes[_disputeId];
        uint256 totalSlashed;
        uint256 jurorCount = dispute.selectedJurors.length;

        for (uint256 i = 0; i < jurorCount; i++) {
            address juror = dispute.selectedJurors[i];
            uint256 snapshotStake = dispute.jurorStakeSnapshot[juror];
            
            // Record pending slashes (don't apply yet - wait for appeal period)
            if (!dispute.hasRevealed[juror]) {
                // Non-revealer: record pending slash
                uint256 slashAmount = snapshotStake * SLASH_PERCENTAGE / 100;
                // Ensure we don't slash more than current stake
                if (slashAmount > jurors[juror].stakedAmount) {
                    slashAmount = jurors[juror].stakedAmount;
                }
                dispute.pendingSlash[juror] = slashAmount;
                totalSlashed += slashAmount;
                
                emit JurorSlashed(_disputeId, juror, slashAmount, "Non-reveal (pending)");
            } else if (dispute.votedForClient[juror] != dispute.clientWon) {
                // Loser: record pending slash
                uint256 slashAmount = snapshotStake * SLASH_PERCENTAGE / 100;
                // Ensure we don't slash more than current stake
                if (slashAmount > jurors[juror].stakedAmount) {
                    slashAmount = jurors[juror].stakedAmount;
                }
                dispute.pendingSlash[juror] = slashAmount;
                totalSlashed += slashAmount;
                
                emit JurorSlashed(_disputeId, juror, slashAmount, "Wrong vote (pending)");
            }
        }

        return totalSlashed;
    }

    /**
     * @dev Apply pending slashes after appeal period expires
     * Called when rewards are claimed or when explicitly finalized
     */
    function _applyPendingSlashes(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        require(block.timestamp > dispute.appealPeriodEnd, "Appeal period not ended");
        
        for (uint256 i = 0; i < dispute.selectedJurors.length; i++) {
            address juror = dispute.selectedJurors[i];
            uint256 slashAmount = dispute.pendingSlash[juror];
            
            if (slashAmount > 0) {
                // Apply the slash now
                if (slashAmount > jurors[juror].stakedAmount) {
                    slashAmount = jurors[juror].stakedAmount;
                }
                jurors[juror].stakedAmount -= slashAmount;
                
                // Check stake invariant
                _enforceStakeInvariant(juror);
                
                // Clear pending slash
                dispute.pendingSlash[juror] = 0;
            }
        }
    }

    /**
     * @dev Enforce stake invariant: stakedAmount >= lockedStake
     * If violated, mark juror as ineligible to prevent further selection
     */
    function _enforceStakeInvariant(address _juror) internal {
        Juror storage juror = jurors[_juror];
        
        // If stake dropped below locked amount, mark as ineligible and remove from trees
        if (juror.stakedAmount < juror.lockedStake) {
            juror.isEligible = false;
            bytes32 jurorID = bytes32(uint256(uint160(_juror)));
            
            // Remove from all category trees (weight = 0)
            for (uint256 i = 0; i < juror.categories.length; i++) {
                bytes32 treeKey = bytes32(juror.categories[i]);
                sortitionTrees.set(treeKey, 0, jurorID);
            }
            
            // Note: Juror remains staked but cannot be selected until they add more stake
            // Their lockedStake will be released as disputes resolve
        }
    }

    /**
     * @dev Pull-based reward claiming for winning jurors
     */
    function claimReward(uint256 _disputeId) external nonReentrant {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.isResolved, "Dispute not resolved");
        require(
            block.timestamp > dispute.appealPeriodEnd,
            "Appeal period not ended"
        );
        require(!dispute.hasClaimed[msg.sender], "Already claimed");
        require(_isSelectedJuror(_disputeId, msg.sender), "Not a juror");

        _claimRewardInternal(_disputeId);
    }

    /**
     * @dev Batch claim rewards for multiple disputes
     */
    function claimRewardsBatch(uint256[] calldata _disputeIds) external nonReentrant {
        for (uint256 i = 0; i < _disputeIds.length; i++) {
            Dispute storage dispute = disputes[_disputeIds[i]];
            if (
                !dispute.hasClaimed[msg.sender] && 
                dispute.isResolved && 
                block.timestamp > dispute.appealPeriodEnd
            ) {
                _claimRewardInternal(_disputeIds[i]);
            }
        }
    }

    /**
     * @dev Internal claim logic
     * Applies pending slashes and distributes rewards after appeal period
     */
    function _claimRewardInternal(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        
        // Verify caller is a selected juror
        require(_isSelectedJuror(_disputeId, msg.sender), "Not a selected juror");
        
        // Apply pending slashes for this juror if not already applied
        if (dispute.pendingSlash[msg.sender] > 0) {
            uint256 slashAmount = dispute.pendingSlash[msg.sender];
            if (slashAmount > jurors[msg.sender].stakedAmount) {
                slashAmount = jurors[msg.sender].stakedAmount;
            }
            jurors[msg.sender].stakedAmount -= slashAmount;
            _enforceStakeInvariant(msg.sender);
            dispute.pendingSlash[msg.sender] = 0;
        }
        
        dispute.hasClaimed[msg.sender] = true;
        
        // Unlock stake for this juror now that appeal period is over
        jurors[msg.sender].activeDisputeCount--;
        jurors[msg.sender].lockedStake -= STAKE_LOCK_PER_DISPUTE;

        // Check if winner - only winners get rewards
        if (dispute.hasRevealed[msg.sender] && 
            dispute.votedForClient[msg.sender] == dispute.clientWon) {
            // Winner: get reward
            uint256 reward = dispute.rewardPerWinner;
            jurors[msg.sender].stakedAmount += reward;
            jurors[msg.sender].correctVotes++;
            
            // Update sortition tree weight (total stake increased)
            _updateJurorWeight(msg.sender);
            
            emit RewardClaimed(_disputeId, msg.sender, reward);
        } else {
            // Loser or non-revealer: just update weight after slash
            _updateJurorWeight(msg.sender);
        }
        // Note: Losers and non-revealers were already slashed during resolution
        // They just need to claim to mark hasClaimed = true (no other effects)
    }

    /**
     * @dev Internal: Check if address is a selected juror (O(1) lookup)
     */
    function _isSelectedJuror(
        uint256 _disputeId,
        address _juror
    ) internal view returns (bool) {
        return jurors[_juror].isSelectedForDispute[_disputeId];
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
