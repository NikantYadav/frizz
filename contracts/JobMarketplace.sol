// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./JobEscrow.sol";
import "./Arbitration.sol";
import "./ReputationSystem.sol";
import "./WorkerRegistry.sol";

/**
 * @title JobMarketplace
 * @dev Main contract handling job creation, applications, worker selection, and dispute management
 * Integrates with JobEscrow and Arbitration contracts
 * Note: Negotiation is handled off-chain
 */
contract JobMarketplace is ReentrancyGuard, Ownable {
    Arbitration public immutable arbitration;
    IERC20 public immutable usdc; // USDC for arbitration fees
    address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    ReputationSystem public immutable reputationSystem;
    WorkerRegistry public immutable workerRegistry;

    struct Job {
        uint256 jobId;
        address client;
        string title;
        string description;
        string skills;
        uint256 categoryId; // Category ID for arbitration juror filtering
        uint256 budget;
        bool isActive;
        bool isCompleted;
        address selectedWorker;
        address escrowContract;
        string workSubmissionHash; // IPFS hash
        bool workSubmitted;
        uint256 disputeId;
        bool isDisputed;
    }

    struct Application {
        address worker;
        string coverLetterHash; // IPFS hash
        string workHistoryHash; // IPFS hash
        uint256 timestamp;
    }

    uint256 public jobCounter;
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application[]) public jobApplications;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public workerApplications;
    mapping(address => uint256[]) public workerJobs; // Jobs where worker is selected

    event JobPosted(
        uint256 indexed jobId,
        address indexed client,
        string title,
        uint256 categoryId,
        uint256 budget
    );
    event ApplicationSubmitted(uint256 indexed jobId, address indexed worker);
    event WorkerSelected(uint256 indexed jobId, address indexed worker);
    event EscrowCreated(uint256 indexed jobId, address escrowContract);
    event WorkSubmitted(uint256 indexed jobId, string workHash);
    event PaymentReleased(
        uint256 indexed jobId,
        address indexed worker,
        uint256 amount
    );
    event DisputeRaised(uint256 indexed jobId, uint256 disputeId);
    event DisputeResolved(uint256 indexed jobId, bool clientWon);

    modifier onlyClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Only client");
        _;
    }

    modifier onlySelectedWorker(uint256 _jobId) {
        require(
            jobs[_jobId].selectedWorker == msg.sender,
            "Only selected worker"
        );
        _;
    }

    constructor(
        address _arbitration,
        address _reputationSystem,
        address _workerRegistry
    ) Ownable(msg.sender) {
        arbitration = Arbitration(_arbitration);
        usdc = IERC20(USDC_ADDRESS);
        reputationSystem = ReputationSystem(_reputationSystem);
        workerRegistry = WorkerRegistry(_workerRegistry);
    }

    /**
     * @dev Post a new job
     */
    function postJob(
        string memory _title,
        string memory _description,
        string memory _skills,
        uint256 _categoryId,
        uint256 _budget
    ) external returns (uint256) {
        require(_budget > 0, "Budget must be positive");
        require(bytes(_title).length > 0, "Title required");

        jobCounter++;

        jobs[jobCounter] = Job({
            jobId: jobCounter,
            client: msg.sender,
            title: _title,
            description: _description,
            skills: _skills,
            categoryId: _categoryId,
            budget: _budget,
            isActive: true,
            isCompleted: false,
            selectedWorker: address(0),
            escrowContract: address(0),
            workSubmissionHash: "",
            workSubmitted: false,
            disputeId: 0,
            isDisputed: false
        });

        clientJobs[msg.sender].push(jobCounter);

        emit JobPosted(jobCounter, msg.sender, _title, _categoryId, _budget);
        return jobCounter;
    }

    /**
     * @dev Apply to a job with IPFS hashes for cover letter and work history
     */
    function applyToJob(
        uint256 _jobId,
        string memory _coverLetterHash,
        string memory _workHistoryHash
    ) external {
        require(jobs[_jobId].isActive, "Job not active");
        require(
            jobs[_jobId].selectedWorker == address(0),
            "Worker already selected"
        );
        require(bytes(_coverLetterHash).length > 0, "Cover letter required");

        jobApplications[_jobId].push(
            Application({
                worker: msg.sender,
                coverLetterHash: _coverLetterHash,
                workHistoryHash: _workHistoryHash,
                timestamp: block.timestamp
            })
        );

        workerApplications[msg.sender].push(_jobId);

        emit ApplicationSubmitted(_jobId, msg.sender);
    }

    /**
     * @dev Create escrow and fund it
     */
    function createAndFundEscrow(
        uint256 _jobId
    ) external onlyClient(_jobId) nonReentrant {
        require(
            jobs[_jobId].escrowContract == address(0),
            "Escrow already created"
        );

        uint256 budget = jobs[_jobId].budget;
        
        // Transfer USDC from client to marketplace
        require(
            usdc.transferFrom(msg.sender, address(this), budget),
            "USDC transfer failed"
        );

        // Create new escrow contract
        JobEscrow escrow = new JobEscrow(msg.sender, budget);
        jobs[_jobId].escrowContract = address(escrow);

        // Transfer USDC to escrow
        require(
            usdc.transfer(address(escrow), budget),
            "Escrow funding failed"
        );
        escrow.fundFromMarketplace();

        emit EscrowCreated(_jobId, address(escrow));
    }

    /**
     * @dev Select a worker for the job
     */
    function selectWorker(
        uint256 _jobId,
        address _worker
    ) external onlyClient(_jobId) {
        require(jobs[_jobId].isActive, "Job not active");
        require(
            jobs[_jobId].escrowContract != address(0),
            "Escrow not created"
        );
        require(
            jobs[_jobId].selectedWorker == address(0),
            "Worker already selected"
        );
        require(_hasApplied(_jobId, _worker), "Worker has not applied");

        jobs[_jobId].selectedWorker = _worker;
        workerJobs[_worker].push(_jobId);

        // Set worker in escrow
        JobEscrow(jobs[_jobId].escrowContract).setWorker(_worker);

        emit WorkerSelected(_jobId, _worker);
    }

    /**
     * @dev Worker submits completed work (IPFS hash)
     */
    function submitWork(
        uint256 _jobId,
        string memory _workHash
    ) external onlySelectedWorker(_jobId) {
        require(!jobs[_jobId].workSubmitted, "Work already submitted");
        require(bytes(_workHash).length > 0, "Work hash required");

        jobs[_jobId].workSubmitted = true;
        jobs[_jobId].workSubmissionHash = _workHash;

        emit WorkSubmitted(_jobId, _workHash);
    }

    /**
     * @dev Client accepts work and releases full payment
     */
    function acceptWorkAndPay(
        uint256 _jobId
    ) external onlyClient(_jobId) nonReentrant {
        require(jobs[_jobId].workSubmitted, "Work not submitted");
        require(!jobs[_jobId].isCompleted, "Already completed");
        require(!jobs[_jobId].isDisputed, "Job is disputed");

        jobs[_jobId].isCompleted = true;
        jobs[_jobId].isActive = false;

        // Release payment through escrow
        JobEscrow escrow = JobEscrow(jobs[_jobId].escrowContract);
        escrow.releaseFullPayment();

        emit PaymentReleased(
            _jobId,
            jobs[_jobId].selectedWorker,
            jobs[_jobId].budget
        );

        // Update reputation
        reputationSystem.recordJobCompletion(
            _jobId,
            jobs[_jobId].selectedWorker,
            jobs[_jobId].client,
            jobs[_jobId].budget
        );
    }

    /**
     * @dev Rate worker after completion
     */
    function rateWorker(
        uint256 _jobId,
        uint8 _rating
    ) external onlyClient(_jobId) {
        require(jobs[_jobId].isCompleted, "Job not completed");
        reputationSystem.updateRating(
            _jobId,
            jobs[_jobId].selectedWorker,
            msg.sender,
            _rating
        );
    }

    /**
     * @dev Rate client after completion
     */
    function rateClient(
        uint256 _jobId,
        uint8 _rating
    ) external onlySelectedWorker(_jobId) {
        require(jobs[_jobId].isCompleted, "Job not completed");
        reputationSystem.updateRating(
            _jobId,
            jobs[_jobId].client,
            msg.sender,
            _rating
        );
    }

    /**
     * @dev Raise a dispute (can be called by client or worker)
     */
    function raiseDispute(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.client || msg.sender == job.selectedWorker,
            "Only parties can dispute"
        );
        require(job.workSubmitted, "Work not submitted yet");
        require(!job.isDisputed, "Already disputed");
        require(!job.isCompleted, "Job already completed");

        // Transfer USDC arbitration fee from disputing party to marketplace
        // Marketplace will then approve Arbitration contract to pull the fee
        uint256 arbitrationFee = arbitration.ARBITRATION_FEE();
        require(
            usdc.transferFrom(msg.sender, address(this), arbitrationFee),
            "USDC arbitration fee transfer failed"
        );
        
        // Approve Arbitration contract to pull the USDC fee
        usdc.approve(address(arbitration), arbitrationFee);

        job.isDisputed = true;

        // Mark escrow as disputed
        JobEscrow(job.escrowContract).raiseDispute();

        // Create dispute in arbitration contract
        uint256 disputeId = arbitration.createDispute(
            _jobId,
            job.client,
            job.selectedWorker,
            job.categoryId,
            job.budget
        );

        job.disputeId = disputeId;

        emit DisputeRaised(_jobId, disputeId);
    }

    /**
     * @dev Resolve dispute based on arbitration result
     */
    function resolveDispute(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.isDisputed, "Not disputed");
        require(!job.isCompleted, "Already completed");

        (bool isResolved, bool clientWon) = arbitration.getDisputeResult(
            job.disputeId
        );
        require(isResolved, "Dispute not resolved yet");

        job.isCompleted = true;
        job.isActive = false;

        JobEscrow escrow = JobEscrow(job.escrowContract);

        if (clientWon) {
            // Refund client
            escrow.refundClient(job.budget);
        } else {
            // Pay worker
            escrow.payWorker(job.budget);
        }

        emit DisputeResolved(_jobId, clientWon);

        // Update reputation based on dispute result
        if (clientWon) {
            reputationSystem.recordDisputeResult(
                job.disputeId,
                job.client,
                job.selectedWorker
            );
        } else {
            reputationSystem.recordDisputeResult(
                job.disputeId,
                job.selectedWorker,
                job.client
            );
        }
    }

    /**
     * @dev Get all applications for a job
     */
    function getApplications(
        uint256 _jobId
    ) external view returns (Application[] memory) {
        return jobApplications[_jobId];
    }

    /**
     * @dev Get jobs posted by a client
     */
    function getClientJobs(
        address _client
    ) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }

    /**
     * @dev Get jobs a worker has applied to
     */
    function getWorkerApplications(
        address _worker
    ) external view returns (uint256[] memory) {
        return workerApplications[_worker];
    }

    /**
     * @dev Get jobs where worker is selected
     */
    function getWorkerJobs(
        address _worker
    ) external view returns (uint256[] memory) {
        return workerJobs[_worker];
    }

    /**
     * @dev Get job details
     */
    function getJob(uint256 _jobId) external view returns (Job memory) {
        return jobs[_jobId];
    }

    /**
     * @dev Check if worker has applied to job
     */
    function _hasApplied(
        uint256 _jobId,
        address _worker
    ) internal view returns (bool) {
        Application[] memory applications = jobApplications[_jobId];
        for (uint256 i = 0; i < applications.length; i++) {
            if (applications[i].worker == _worker) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get active jobs (for broadcasting to workers)
     */
    function getActiveJobs() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].isActive && jobs[i].selectedWorker == address(0)) {
                activeCount++;
            }
        }

        uint256[] memory activeJobs = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (jobs[i].isActive && jobs[i].selectedWorker == address(0)) {
                activeJobs[index] = i;
                index++;
            }
        }

        return activeJobs;
    }

    /**
     * @dev Filter jobs by category
     */
    function getJobsByCategory(
        uint256 _categoryId
    ) external view returns (uint256[] memory) {
        uint256 matchCount = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (
                jobs[i].isActive &&
                jobs[i].selectedWorker == address(0) &&
                jobs[i].categoryId == _categoryId
            ) {
                matchCount++;
            }
        }

        uint256[] memory matchedJobs = new uint256[](matchCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (
                jobs[i].isActive &&
                jobs[i].selectedWorker == address(0) &&
                jobs[i].categoryId == _categoryId
            ) {
                matchedJobs[index] = i;
                index++;
            }
        }

        return matchedJobs;
    }
}
