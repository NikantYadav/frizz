// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSystem
 * @dev Tracks reputation scores and ratings for users (clients and workers)
 */
contract ReputationSystem is Ownable {
    struct Reputation {
        uint256 score;            // 0-100 score
        uint256 completedJobs;    // Number of successfully completed jobs
        uint256 disputeWins;      // Number of disputes won
        uint256 disputeLosses;    // Number of disputes lost
        uint256 totalVolume;      // Total ETH volume processed
        uint256 ratingsSum;       // Sum of all ratings received
        uint256 ratingCount;      // Number of ratings received
    }

    mapping(address => Reputation) public reputations;
    mapping(address => bool) public authorizedCallers;

    event ReputationUpdated(address indexed user, uint256 newScore);
    event RatingReceived(address indexed user, address indexed rater, uint8 rating);

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
     * @dev Update user rating (1-5 scale)
     */
    function updateRating(address _user, uint8 _rating) external onlyAuthorized {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        Reputation storage rep = reputations[_user];
        rep.ratingsSum += _rating;
        rep.ratingCount++;
        
        _recalculateScore(_user);
        emit RatingReceived(_user, msg.sender, _rating);
    }

    /**
     * @dev Record a completed job
     */
    function recordJobCompletion(address _worker, address _client, uint256 _amount) external onlyAuthorized {
        // Update worker stats
        Reputation storage workerRep = reputations[_worker];
        workerRep.completedJobs++;
        workerRep.totalVolume += _amount;
        _recalculateScore(_worker);
        
        // Update client stats
        Reputation storage clientRep = reputations[_client];
        clientRep.completedJobs++;
        clientRep.totalVolume += _amount;
         _recalculateScore(_client);
    }

    /**
     * @dev Record a dispute result
     */
    function recordDisputeResult(address _winner, address _loser) external onlyAuthorized {
        reputations[_winner].disputeWins++;
        _recalculateScore(_winner);
        
        reputations[_loser].disputeLosses++;
        _recalculateScore(_loser);
    }

    /**
     * @dev Internal function to calculate score based on stats
     */
    function _recalculateScore(address _user) internal {
        Reputation storage rep = reputations[_user];
        
        // Base Score: 50
        // Rating Impact: Average Rating * 10 (Max 50)
        // Volume/Experience Bonus: +1 per job (Max 20)
        // Dispute Penalty: -15 per loss
        
        uint256 baseScore = 50;
        uint256 ratingScore = 0;
        
        if (rep.ratingCount > 0) {
            // ratingsSum * 10 / ratingCount -> 5.0 * 10 = 50
            ratingScore = (rep.ratingsSum * 10) / rep.ratingCount;
        }
        
        uint256 jobBonus = rep.completedJobs > 20 ? 20 : rep.completedJobs;
        uint256 disputePenalty = rep.disputeLosses * 15;
        
        uint256 totalScore = baseScore + ratingScore + jobBonus;
        
        if (totalScore > disputePenalty) {
            rep.score = totalScore - disputePenalty;
        } else {
            rep.score = 0;
        }
        
        if (rep.score > 100) rep.score = 100;
        
        emit ReputationUpdated(_user, rep.score);
    }

    function getReputation(address _user) external view returns (Reputation memory) {
        return reputations[_user];
    }
}
