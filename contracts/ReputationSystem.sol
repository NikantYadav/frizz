// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSystem
 * @dev Tracks raw reputation stats for users (clients and workers)
 * Note: Score calculation should be done off-chain for flexibility
 * This allows formula changes without contract redeployment
 */
contract ReputationSystem is Ownable {
    struct Reputation {
        uint256 completedJobs;    // Number of successfully completed jobs
        uint256 disputeWins;      // Number of disputes won
        uint256 disputeLosses;    // Number of disputes lost
        uint256 totalVolume;      // Total USDC volume processed
        uint256 ratingsSum;       // Sum of all ratings received (1-5 scale)
        uint256 ratingCount;      // Number of ratings received
    }

    struct JobRecord {
        address worker;
        address client;
        bool completed;
        bool workerRated;  // Has worker rated client?
        bool clientRated;  // Has client rated worker?
    }

    mapping(address => Reputation) public reputations;
    mapping(address => bool) public authorizedCallers;
    
    // Job tracking
    mapping(uint256 => JobRecord) public jobs; // jobId => JobRecord
    mapping(uint256 => bool) public disputeResolved; // disputeId => resolved

    event JobCompleted(
        uint256 indexed jobId,
        address indexed worker,
        address indexed client,
        uint256 volume
    );
    event DisputeResultRecorded(
        uint256 indexed disputeId,
        address indexed winner,
        address indexed loser
    );
    event RatingReceived(
        uint256 indexed jobId,
        address indexed user,
        address indexed rater,
        uint8 rating
    );

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Authorize a contract (e.g., Marketplace) to update reputation
     */
    function setAuthorizedCaller(address _caller, bool _status) external onlyOwner {
        authorizedCallers[_caller] = _status;
    }

    /**
     * @dev Update user rating (1-5 scale) for a specific job
     * @param _jobId Job ID to prevent duplicate ratings
     * @param _user User being rated
     * @param _rater Address giving the rating (must be job participant)
     * @param _rating Rating value (1-5)
     */
    function updateRating(
        uint256 _jobId,
        address _user,
        address _rater,
        uint8 _rating
    ) external onlyAuthorized {
        require(_user != address(0), "Invalid user address");
        require(_rater != address(0), "Invalid rater address");
        require(_user != _rater, "Cannot rate self");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        JobRecord storage job = jobs[_jobId];
        require(job.completed, "Job not completed yet");
        require(job.worker != address(0), "Job not found");
        
        // Verify rater is a participant and hasn't rated yet
        if (_rater == job.client) {
            require(_user == job.worker, "Client can only rate worker");
            require(!job.clientRated, "Client already rated");
            job.clientRated = true;
        } else if (_rater == job.worker) {
            require(_user == job.client, "Worker can only rate client");
            require(!job.workerRated, "Worker already rated");
            job.workerRated = true;
        } else {
            revert("Rater not a job participant");
        }
        
        Reputation storage rep = reputations[_user];
        rep.ratingsSum += _rating;
        rep.ratingCount++;
        
        emit RatingReceived(_jobId, _user, _rater, _rating);
    }

    /**
     * @dev Record a completed job
     * @param _jobId Unique job identifier
     * @param _worker Worker address
     * @param _client Client address
     * @param _amount Job amount in USDC (6 decimals)
     */
    function recordJobCompletion(
        uint256 _jobId,
        address _worker,
        address _client,
        uint256 _amount
    ) external onlyAuthorized {
        require(_worker != address(0), "Invalid worker address");
        require(_client != address(0), "Invalid client address");
        require(_worker != _client, "Worker and client cannot be same");
        
        JobRecord storage job = jobs[_jobId];
        require(job.worker == address(0), "Job already recorded");
        
        // Record job details
        job.worker = _worker;
        job.client = _client;
        job.completed = true;
        job.workerRated = false;
        job.clientRated = false;
        
        // Update worker stats
        Reputation storage workerRep = reputations[_worker];
        workerRep.completedJobs++;
        workerRep.totalVolume += _amount;
        
        // Update client stats
        Reputation storage clientRep = reputations[_client];
        clientRep.completedJobs++;
        clientRep.totalVolume += _amount;
        
        emit JobCompleted(_jobId, _worker, _client, _amount);
    }

    /**
     * @dev Record a dispute result
     * @param _disputeId Unique dispute identifier
     * @param _winner Winner address
     * @param _loser Loser address
     */
    function recordDisputeResult(
        uint256 _disputeId,
        address _winner,
        address _loser
    ) external onlyAuthorized {
        require(_winner != address(0), "Invalid winner address");
        require(_loser != address(0), "Invalid loser address");
        require(_winner != _loser, "Winner and loser cannot be same");
        require(!disputeResolved[_disputeId], "Dispute already recorded");
        
        disputeResolved[_disputeId] = true;
        
        reputations[_winner].disputeWins++;
        reputations[_loser].disputeLosses++;
        
        emit DisputeResultRecorded(_disputeId, _winner, _loser);
    }

    /**
     * @dev Get reputation stats for a user
     */
    function getReputation(address _user) external view returns (Reputation memory) {
        return reputations[_user];
    }

    /**
     * @dev Get average rating for a user (scaled by 100)
     * Returns rating * 100 (e.g., 450 = 4.5 stars, 500 = 5.0 stars)
     * Returns 0 if no ratings
     */
    function getAverageRatingScaled(address _user) external view returns (uint256) {
        Reputation storage rep = reputations[_user];
        if (rep.ratingCount == 0) return 0;
        return (rep.ratingsSum * 100) / rep.ratingCount;
    }

    /**
     * @dev Check if a job has been recorded
     */
    function isJobRecorded(uint256 _jobId) external view returns (bool) {
        return jobs[_jobId].worker != address(0);
    }

    /**
     * @dev Check if a dispute has been recorded
     */
    function isDisputeRecorded(uint256 _disputeId) external view returns (bool) {
        return disputeResolved[_disputeId];
    }

    /**
     * @dev Get job details
     */
    function getJobRecord(uint256 _jobId) external view returns (JobRecord memory) {
        return jobs[_jobId];
    }

    /**
     * @dev Check if both parties have rated each other
     */
    function areBothRatingsComplete(uint256 _jobId) external view returns (bool) {
        JobRecord storage job = jobs[_jobId];
        return job.workerRated && job.clientRated;
    }
}
