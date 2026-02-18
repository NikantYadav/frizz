// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./JobEscrow.sol";
import "./Arbitration.sol";

/**
 * @title JobMarketplace
 * @dev Main contract handling job creation, applications, worker selection, and dispute management
 * Integrates with JobEscrow and Arbitration contracts
 */
contract JobMarketplace is ReentrancyGuard, Ownable {
    Arbitration public immutable arbitration;
    
    struct Job {
        uint256 jobId;
        address client;
        string title;
        string description;
        string skills;
        string category; // For juror filtering
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
    
    event JobPosted(
        uint256 indexed jobId,
        address indexed client,
        string title,
        string category,
        uint256 budget
    );
    event ApplicationSubmitted(uint256 indexed jobId, address indexed worker);
    event WorkerSelected(uint256 indexed jobId, address indexed worker);
    event EscrowCreated(uint256 indexed jobId, address escrowContract);
    event WorkSubmitted(uint256 indexed jobId, string workHash);
    event PaymentReleased(uint256 indexed jobId, address indexed worker, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, uint256 disputeId);
    event DisputeResolved(uint256 indexed jobId, bool clientWon);
    
    modifier onlyClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Only client");
        _;
    }
    
    modifier onlySelectedWorker(uint256 _jobId) {
        require(jobs[_jobId].selectedWorker == msg.sender, "Only selected worker");
        _;
    }
    
    constructor(address _arbitration) Ownable(msg.sender) {
        arbitration = Arbitration(_arbitration);
    }
    
    /**
     * @dev Post a new job
     */
    function postJob(
        string memory _title,
        string memory _description,
        string memory _skills,
        string memory _category,
        uint256 _budget
    ) external returns (uint256) {
        require(_budget > 0, "Budget must be positive");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_category).length > 0, "Category required");
        
        jobCounter++;
        
        jobs[jobCounter] = Job({
            jobId: jobCounter,
            client: msg.sender,
            title: _title,
            description: _description,
            skills: _skills,
            category: _category,
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
        
        emit JobPosted(jobCounter, msg.sender, _title, _category, _budget);
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
        require(jobs[_jobId].selectedWorker == address(0), "Worker already selected");
        require(bytes(_coverLetterHash).length > 0, "Cover letter required");
        
        jobApplications[_jobId].push(Application({
            worker: msg.sender,
            coverLetterHash: _coverLetterHash,
            workHistoryHash: _workHistoryHash,
            timestamp: block.timestamp
        }));
        
        workerApplications[msg.sender].push(_jobId);
        
        emit ApplicationSubmitted(_jobId, msg.sender);
    }
    
    /**
     * @dev Create escrow and fund it
     */
    function createAndFundEscrow(uint256 _jobId) 
        external 
        payable 
        onlyClient(_jobId) 
        nonReentrant 
    {
        require(jobs[_jobId].escrowContract == address(0), "Escrow already created");
        require(msg.value == jobs[_jobId].budget, "Must match budget");
        
        // Create new escrow contract
        JobEscrow escrow = new JobEscrow(msg.sender, jobs[_jobId].budget);
        jobs[_jobId].escrowContract = address(escrow);
        
        // Fund the escrow by forwarding the ETH
        (bool success, ) = address(escrow).call{value: msg.value}(
            abi.encodeWithSignature("fundFromMarketplace()")
        );
        require(success, "Escrow funding failed");
        
        emit EscrowCreated(_jobId, address(escrow));
    }
    
    /**
     * @dev Select a worker for the job
     */
    function selectWorker(uint256 _jobId, address _worker) 
        external 
        onlyClient(_jobId) 
    {
        require(jobs[_jobId].isActive, "Job not active");
        require(jobs[_jobId].escrowContract != address(0), "Escrow not created");
        require(jobs[_jobId].selectedWorker == address(0), "Worker already selected");
        require(_hasApplied(_jobId, _worker), "Worker has not applied");
        
        jobs[_jobId].selectedWorker = _worker;
        
        // Set worker in escrow
        JobEscrow(jobs[_jobId].escrowContract).setWorker(_worker);
        
        emit WorkerSelected(_jobId, _worker);
    }
    
    /**
     * @dev Worker submits completed work (IPFS hash)
     */
    function submitWork(uint256 _jobId, string memory _workHash) 
        external 
        onlySelectedWorker(_jobId) 
    {
        require(!jobs[_jobId].workSubmitted, "Work already submitted");
        require(bytes(_workHash).length > 0, "Work hash required");
        
        jobs[_jobId].workSubmitted = true;
        jobs[_jobId].workSubmissionHash = _workHash;
        
        emit WorkSubmitted(_jobId, _workHash);
    }
    
    /**
     * @dev Client accepts work and releases full payment
     */
    function acceptWorkAndPay(uint256 _jobId) 
        external 
        onlyClient(_jobId) 
        nonReentrant 
    {
        require(jobs[_jobId].workSubmitted, "Work not submitted");
        require(!jobs[_jobId].isCompleted, "Already completed");
        require(!jobs[_jobId].isDisputed, "Job is disputed");
        
        jobs[_jobId].isCompleted = true;
        jobs[_jobId].isActive = false;
        
        // Release payment through escrow
        JobEscrow escrow = JobEscrow(jobs[_jobId].escrowContract);
        escrow.releaseFullPayment();
        
        emit PaymentReleased(_jobId, jobs[_jobId].selectedWorker, jobs[_jobId].budget);
    }
    
    /**
     * @dev Add milestone to job escrow
     */
    function addMilestone(
        uint256 _jobId,
        string memory _description,
        uint256 _amount
    ) external onlyClient(_jobId) {
        require(jobs[_jobId].escrowContract != address(0), "Escrow not created");
        
        JobEscrow escrow = JobEscrow(jobs[_jobId].escrowContract);
        escrow.addMilestone(_description, _amount);
    }
    
    /**
     * @dev Release milestone payment
     */
    function releaseMilestonePayment(uint256 _jobId, uint256 _milestoneId) 
        external 
        onlyClient(_jobId) 
        nonReentrant 
    {
        require(jobs[_jobId].escrowContract != address(0), "Escrow not created");
        require(!jobs[_jobId].isDisputed, "Job is disputed");
        
        JobEscrow escrow = JobEscrow(jobs[_jobId].escrowContract);
        escrow.releaseMilestonePayment(_milestoneId);
    }
    
    /**
     * @dev Raise a dispute (can be called by client or worker)
     */
    function raiseDispute(uint256 _jobId) 
        external 
        payable 
        nonReentrant 
    {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.client || msg.sender == job.selectedWorker,
            "Only parties can dispute"
        );
        require(job.workSubmitted, "Work not submitted yet");
        require(!job.isDisputed, "Already disputed");
        require(!job.isCompleted, "Job already completed");
        
        job.isDisputed = true;
        
        // Mark escrow as disputed
        JobEscrow(job.escrowContract).raiseDispute();
        
        // Create dispute in arbitration contract
        uint256 disputeId = arbitration.createDispute{value: msg.value}(
            _jobId,
            job.client,
            job.selectedWorker,
            job.category,
            job.budget
        );
        
        job.disputeId = disputeId;
        
        emit DisputeRaised(_jobId, disputeId);
    }
    
    /**
     * @dev Resolve dispute based on arbitration result
     */
    function resolveDispute(uint256 _jobId) 
        external 
        nonReentrant 
    {
        Job storage job = jobs[_jobId];
        require(job.isDisputed, "Not disputed");
        require(!job.isCompleted, "Already completed");
        
        (bool isResolved, bool clientWon) = arbitration.getDisputeResult(job.disputeId);
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
    }
    
    /**
     * @dev Get all applications for a job
     */
    function getApplications(uint256 _jobId) 
        external 
        view 
        returns (Application[] memory) 
    {
        return jobApplications[_jobId];
    }
    
    /**
     * @dev Get jobs posted by a client
     */
    function getClientJobs(address _client) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return clientJobs[_client];
    }
    
    /**
     * @dev Get jobs a worker has applied to
     */
    function getWorkerApplications(address _worker) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return workerApplications[_worker];
    }
    
    /**
     * @dev Get job details
     */
    function getJob(uint256 _jobId) 
        external 
        view 
        returns (Job memory) 
    {
        return jobs[_jobId];
    }
    
    /**
     * @dev Check if worker has applied to job
     */
    function _hasApplied(uint256 _jobId, address _worker) 
        internal 
        view 
        returns (bool) 
    {
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
    function getActiveJobs() 
        external 
        view 
        returns (uint256[] memory) 
    {
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
    function getJobsByCategory(string memory _category) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 matchCount = 0;
        for (uint256 i = 1; i <= jobCounter; i++) {
            if (
                jobs[i].isActive && 
                jobs[i].selectedWorker == address(0) &&
                keccak256(bytes(jobs[i].category)) == keccak256(bytes(_category))
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
                keccak256(bytes(jobs[i].category)) == keccak256(bytes(_category))
            ) {
                matchedJobs[index] = i;
                index++;
            }
        }
        
        return matchedJobs;
    }
}
