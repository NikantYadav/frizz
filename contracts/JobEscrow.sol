// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title JobEscrow
 * @dev Handles escrow for individual jobs with milestone support
 * Uses factory pattern - one escrow per job
 */
contract JobEscrow is ReentrancyGuard {
    address public immutable client;
    address public worker;
    address public marketplace;
    uint256 public totalBudget;
    uint256 public lockedAmount;
    uint256 public releasedAmount;
    bool public isDisputed;
    
    struct Milestone {
        string description;
        uint256 amount;
        bool isCompleted;
        bool isPaid;
    }
    
    Milestone[] public milestones;
    
    event Funded(uint256 amount);
    event MilestoneAdded(uint256 indexed milestoneId, uint256 amount);
    event MilestonePaid(uint256 indexed milestoneId, uint256 amount);
    event FullPaymentReleased(uint256 amount);
    event RefundIssued(uint256 amount);
    event DisputeRaised();
    
    modifier onlyClient() {
        require(msg.sender == client || msg.sender == marketplace, "Only client or marketplace");
        _;
    }
    
    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "Only marketplace");
        _;
    }
    
    modifier notDisputed() {
        require(!isDisputed, "Contract is disputed");
        _;
    }
    
    constructor(address _client, uint256 _budget) {
        client = _client;
        marketplace = msg.sender;
        totalBudget = _budget;
    }
    
    /**
     * @dev Fund the escrow with ETH
     */
    function fund() external payable onlyClient {
        require(msg.value == totalBudget, "Must match budget");
        require(lockedAmount == 0, "Already funded");
        
        lockedAmount = msg.value;
        emit Funded(msg.value);
    }
    
    /**
     * @dev Fund the escrow from marketplace (called during creation)
     */
    function fundFromMarketplace() external payable onlyMarketplace {
        require(msg.value == totalBudget, "Must match budget");
        require(lockedAmount == 0, "Already funded");
        
        lockedAmount = msg.value;
        emit Funded(msg.value);
    }
    
    /**
     * @dev Set the selected worker
     */
    function setWorker(address _worker) external onlyMarketplace {
        require(worker == address(0), "Worker already set");
        worker = _worker;
    }
    
    /**
     * @dev Add a milestone
     */
    function addMilestone(string memory _description, uint256 _amount) external onlyClient {
        uint256 totalMilestoneAmount = _amount;
        for (uint256 i = 0; i < milestones.length; i++) {
            totalMilestoneAmount += milestones[i].amount;
        }
        require(totalMilestoneAmount <= totalBudget, "Exceeds budget");
        
        milestones.push(Milestone({
            description: _description,
            amount: _amount,
            isCompleted: false,
            isPaid: false
        }));
        
        emit MilestoneAdded(milestones.length - 1, _amount);
    }
    
    /**
     * @dev Release payment for a specific milestone
     * Uses checks-effects-interactions pattern
     */
    function releaseMilestonePayment(uint256 _milestoneId) 
        external 
        onlyClient 
        notDisputed 
        nonReentrant 
    {
        require(_milestoneId < milestones.length, "Invalid milestone");
        Milestone storage milestone = milestones[_milestoneId];
        require(!milestone.isPaid, "Already paid");
        require(lockedAmount >= milestone.amount, "Insufficient funds");
        require(worker != address(0), "No worker selected");
        
        // Effects
        milestone.isCompleted = true;
        milestone.isPaid = true;
        lockedAmount -= milestone.amount;
        releasedAmount += milestone.amount;
        
        // Interactions
        (bool success, ) = payable(worker).call{value: milestone.amount}("");
        require(success, "Transfer failed");
        
        emit MilestonePaid(_milestoneId, milestone.amount);
    }
    
    /**
     * @dev Release full payment to worker
     * Uses checks-effects-interactions pattern
     */
    function releaseFullPayment() 
        external 
        onlyClient 
        notDisputed 
        nonReentrant 
    {
        require(lockedAmount > 0, "No funds locked");
        require(worker != address(0), "No worker selected");
        
        // Effects
        uint256 amount = lockedAmount;
        lockedAmount = 0;
        releasedAmount += amount;
        
        // Interactions
        (bool success, ) = payable(worker).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FullPaymentReleased(amount);
    }
    
    /**
     * @dev Refund client (only via marketplace after dispute resolution)
     */
    function refundClient(uint256 _amount) 
        external 
        onlyMarketplace 
        nonReentrant 
    {
        require(lockedAmount >= _amount, "Insufficient funds");
        
        // Effects
        lockedAmount -= _amount;
        
        // Interactions
        (bool success, ) = payable(client).call{value: _amount}("");
        require(success, "Refund failed");
        
        emit RefundIssued(_amount);
    }
    
    /**
     * @dev Pay worker (only via marketplace after dispute resolution)
     */
    function payWorker(uint256 _amount) 
        external 
        onlyMarketplace 
        nonReentrant 
    {
        require(lockedAmount >= _amount, "Insufficient funds");
        require(worker != address(0), "No worker selected");
        
        // Effects
        lockedAmount -= _amount;
        releasedAmount += _amount;
        
        // Interactions
        (bool success, ) = payable(worker).call{value: _amount}("");
        require(success, "Payment failed");
    }
    
    /**
     * @dev Raise a dispute
     */
    function raiseDispute() external onlyMarketplace {
        isDisputed = true;
        emit DisputeRaised();
    }
    
    /**
     * @dev Get milestone count
     */
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }
    
    /**
     * @dev Get milestone details
     */
    function getMilestone(uint256 _milestoneId) 
        external 
        view 
        returns (string memory description, uint256 amount, bool isCompleted, bool isPaid) 
    {
        require(_milestoneId < milestones.length, "Invalid milestone");
        Milestone memory m = milestones[_milestoneId];
        return (m.description, m.amount, m.isCompleted, m.isPaid);
    }
}
