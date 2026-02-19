// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorkerRegistry
 * @dev Registry for worker profiles and skills
 */
contract WorkerRegistry is Ownable {
    struct Profile {
        string ipfsHash; // IPFS hash containing bio, portfolio, etc.
        uint256 hourlyRate; // Default hourly rate in wei
        string[] skills; // List of skills
        bool isAvailable; // Availability status
        uint256 registeredAt; // Timestamp of registration
    }

    mapping(address => Profile) public profiles;
    address[] public allWorkers;

    // Mapping for skill-based lookups (simplified)
    // Skill -> Array of worker addresses
    mapping(string => address[]) public workersBySkill;

    event ProfileRegistered(
        address indexed worker,
        string ipfsHash,
        uint256 hourlyRate
    );
    event ProfileUpdated(
        address indexed worker,
        string ipfsHash,
        uint256 hourlyRate
    );
    event AvailabilityUpdated(address indexed worker, bool isAvailable);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register or update a worker profile
     */
    function registerProfile(
        string memory _ipfsHash,
        uint256 _hourlyRate,
        string[] memory _skills
    ) external {
        bool isNew = profiles[msg.sender].registeredAt == 0;

        profiles[msg.sender] = Profile({
            ipfsHash: _ipfsHash,
            hourlyRate: _hourlyRate,
            skills: _skills,
            isAvailable: true,
            registeredAt: isNew
                ? block.timestamp
                : profiles[msg.sender].registeredAt
        });

        if (isNew) {
            allWorkers.push(msg.sender);
            emit ProfileRegistered(msg.sender, _ipfsHash, _hourlyRate);
        } else {
            emit ProfileUpdated(msg.sender, _ipfsHash, _hourlyRate);
        }

        // Index skills (Note: this adds to array without removing old ones if updated,
        // comprehensive skill management would require more complex logic or off-chain indexing)
        for (uint i = 0; i < _skills.length; i++) {
            workersBySkill[_skills[i]].push(msg.sender);
        }
    }

    /**
     * @dev Update availability status
     */
    function setAvailability(bool _isAvailable) external {
        require(profiles[msg.sender].registeredAt > 0, "Profile not found");
        profiles[msg.sender].isAvailable = _isAvailable;
        emit AvailabilityUpdated(msg.sender, _isAvailable);
    }

    /**
     * @dev Get worker details
     */
    function getWorker(address _worker) external view returns (Profile memory) {
        return profiles[_worker];
    }

    /**
     * @dev Get all registered workers count
     */
    function getWorkerCount() external view returns (uint256) {
        return allWorkers.length;
    }

    /**
     * @dev Get workers by skill
     */
    function getWorkersBySkill(
        string memory _skill
    ) external view returns (address[] memory) {
        return workersBySkill[_skill];
    }
}
