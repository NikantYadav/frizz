// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuantumRandomnessOracle
 * @dev Oracle contract for ANU Quantum Random Numbers
 *
 * IMPORTANT: This contract requires an off-chain service to:
 * 1. Listen for RandomnessRequested events
 * 2. Fetch quantum random numbers from ANU API
 * 3. Call fulfillRandomness() with the result
 *
 * ANU Quantum API: https://api.quantumnumbers.anu.edu.au
 * Example: GET ?length=1&type=uint16 with x-api-key header
 */
contract QuantumRandomnessOracle is Ownable {
    struct RandomnessRequest {
        address requester;
        uint256 randomNumber;
        bool fulfilled;
        uint256 timestamp;
    }

    mapping(bytes32 => RandomnessRequest) public requests;
    mapping(address => bool) public authorizedFulfillers;

    uint256 public requestCounter;
    uint256 public fulfillmentTimeout = 5 minutes;

    event RandomnessRequested(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 timestamp
    );

    event RandomnessFulfilled(bytes32 indexed requestId, uint256 randomNumber);

    event FulfillerAuthorized(address indexed fulfiller);
    event FulfillerRevoked(address indexed fulfiller);

    modifier onlyAuthorizedFulfiller() {
        require(
            authorizedFulfillers[msg.sender] || msg.sender == owner(),
            "Not authorized fulfiller"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedFulfillers[msg.sender] = true;
    }

    /**
     * @dev Request a quantum random number
     * @return requestId Unique identifier for this request
     */
    function requestRandomness() external returns (bytes32) {
        requestCounter++;
        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                requestCounter,
                block.timestamp,
                block.number
            )
        );

        requests[requestId] = RandomnessRequest({
            requester: msg.sender,
            randomNumber: 0,
            fulfilled: false,
            timestamp: block.timestamp
        });

        emit RandomnessRequested(requestId, msg.sender, block.timestamp);
        return requestId;
    }

    /**
     * @dev Fulfill a randomness request (called by off-chain oracle)
     * @param _requestId The request to fulfill
     * @param _randomNumber The quantum random number from ANU API
     */
    function fulfillRandomness(
        bytes32 _requestId,
        uint256 _randomNumber
    ) external onlyAuthorizedFulfiller {
        RandomnessRequest storage request = requests[_requestId];
        require(!request.fulfilled, "Already fulfilled");
        require(request.requester != address(0), "Request not found");

        request.randomNumber = _randomNumber;
        request.fulfilled = true;

        emit RandomnessFulfilled(_requestId, _randomNumber);
    }

    /**
     * @dev Get random number for a request
     */
    function getRandomNumber(
        bytes32 _requestId
    ) external view returns (uint256) {
        RandomnessRequest storage request = requests[_requestId];
        require(request.fulfilled, "Not fulfilled yet");
        return request.randomNumber;
    }

    /**
     * @dev Check if random number is ready
     */
    function isRandomNumberReady(
        bytes32 _requestId
    ) external view returns (bool) {
        return requests[_requestId].fulfilled;
    }

    /**
     * @dev Authorize an address to fulfill randomness requests
     */
    function authorizeFulfiller(address _fulfiller) external onlyOwner {
        authorizedFulfillers[_fulfiller] = true;
        emit FulfillerAuthorized(_fulfiller);
    }

    /**
     * @dev Revoke fulfiller authorization
     */
    function revokeFulfiller(address _fulfiller) external onlyOwner {
        authorizedFulfillers[_fulfiller] = false;
        emit FulfillerRevoked(_fulfiller);
    }

    /**
     * @dev Update fulfillment timeout
     */
    function setFulfillmentTimeout(uint256 _timeout) external onlyOwner {
        fulfillmentTimeout = _timeout;
    }

    /**
     * @dev Emergency fallback: use pseudo-random if timeout exceeded
     */
    function fulfillWithFallback(
        bytes32 _requestId
    ) external onlyAuthorizedFulfiller {
        RandomnessRequest storage request = requests[_requestId];
        require(!request.fulfilled, "Already fulfilled");
        require(request.requester != address(0), "Request not found");
        require(
            block.timestamp >= request.timestamp + fulfillmentTimeout,
            "Timeout not reached"
        );

        // Use enhanced pseudo-random as fallback
        uint256 fallbackRandom = uint256(
            keccak256(
                abi.encodePacked(
                    _requestId,
                    block.timestamp,
                    block.prevrandao,
                    block.number,
                    msg.sender
                )
            )
        );

        request.randomNumber = fallbackRandom;
        request.fulfilled = true;

        emit RandomnessFulfilled(_requestId, fallbackRandom);
    }
}
