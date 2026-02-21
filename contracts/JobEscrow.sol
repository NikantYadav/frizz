// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title JobEscrow
 * @dev Handles escrow for individual jobs using USDC
 * Uses factory pattern - one escrow per job
 * Uses pull model for funding - escrow pulls USDC from marketplace
 */
contract JobEscrow is ReentrancyGuard {
    IERC20 public immutable usdc;
    address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    address public immutable client;
    address public worker;
    address public immutable marketplace;
    uint256 public immutable totalBudget;
    uint256 public lockedAmount;
    uint256 public releasedAmount;
    bool public isFunded;
    bool public isDisputed;
    bool public isCompleted;
    
    event Funded(uint256 amount);
    event FullPaymentReleased(address indexed worker, uint256 amount);
    event PartialPaymentReleased(address indexed worker, uint256 amount);
    event RefundIssued(address indexed client, uint256 amount);
    event DisputeRaised();
    event EscrowCompleted();
    
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
    
    modifier onlyWhenDisputed() {
        require(isDisputed, "Only when disputed");
        _;
    }
    
    modifier notCompleted() {
        require(!isCompleted, "Escrow already completed");
        _;
    }
    
    constructor(address _client, uint256 _budget) {
        require(_client != address(0), "Invalid client address");
        require(_budget > 0, "Budget must be positive");
        
        client = _client;
        marketplace = msg.sender;
        totalBudget = _budget;
        usdc = IERC20(USDC_ADDRESS);
    }
    
    /**
     * @dev Fund the escrow by pulling USDC from marketplace (pull model)
     * Marketplace must approve this contract to spend USDC first
     */
    function fundFromMarketplace() external onlyMarketplace nonReentrant {
        require(!isFunded, "Already funded");
        require(lockedAmount == 0, "Already has funds");
        
        // Measure balance delta to verify exact transfer amount
        uint256 balanceBefore = usdc.balanceOf(address(this));
        
        // Pull USDC from marketplace (atomic operation)
        bool success = usdc.transferFrom(marketplace, address(this), totalBudget);
        require(success, "USDC transfer failed");
        
        uint256 balanceAfter = usdc.balanceOf(address(this));
        
        // Verify exactly totalBudget was transferred in this transaction
        require(
            balanceAfter - balanceBefore == totalBudget,
            "Incorrect funding amount"
        );
        
        lockedAmount = totalBudget;
        isFunded = true;
        
        emit Funded(totalBudget);
    }
    
    /**
     * @dev Set the selected worker
     */
    function setWorker(address _worker) external onlyMarketplace {
        require(worker == address(0), "Worker already set");
        require(_worker != address(0), "Invalid worker address");
        worker = _worker;
    }
    
    /**
     * @dev Release full payment to worker
     * Uses checks-effects-interactions pattern
     */
    function releaseFullPayment() 
        external 
        onlyClient 
        notDisputed
        notCompleted
        nonReentrant 
    {
        require(isFunded, "Not funded");
        require(lockedAmount > 0, "No funds locked");
        require(worker != address(0), "No worker selected");
        
        // Effects
        uint256 amount = lockedAmount;
        lockedAmount = 0;
        releasedAmount += amount;
        isCompleted = true;
        
        // Interactions - transfer USDC
        require(
            usdc.transfer(worker, amount),
            "USDC transfer failed"
        );
        
        emit FullPaymentReleased(worker, amount);
        emit EscrowCompleted();
    }
    
    /**
     * @dev Refund client (only via marketplace after dispute resolution)
     */
    function refundClient(uint256 _amount) 
        external 
        onlyMarketplace
        onlyWhenDisputed
        notCompleted
        nonReentrant 
    {
        require(isFunded, "Not funded");
        require(_amount > 0, "Amount must be positive");
        require(lockedAmount >= _amount, "Insufficient funds");
        
        // Effects
        lockedAmount -= _amount;
        
        // Mark as completed if all funds distributed
        if (lockedAmount == 0) {
            isCompleted = true;
        }
        
        // Interactions - transfer USDC
        require(
            usdc.transfer(client, _amount),
            "USDC refund failed"
        );
        
        emit RefundIssued(client, _amount);
        
        if (isCompleted) {
            emit EscrowCompleted();
        }
    }
    
    /**
     * @dev Pay worker (only via marketplace after dispute resolution)
     */
    function payWorker(uint256 _amount) 
        external 
        onlyMarketplace
        onlyWhenDisputed
        notCompleted
        nonReentrant 
    {
        require(isFunded, "Not funded");
        require(_amount > 0, "Amount must be positive");
        require(lockedAmount >= _amount, "Insufficient funds");
        require(worker != address(0), "No worker selected");
        
        // Effects
        lockedAmount -= _amount;
        releasedAmount += _amount;
        
        // Mark as completed if all funds distributed
        if (lockedAmount == 0) {
            isCompleted = true;
        }
        
        // Interactions - transfer USDC
        require(
            usdc.transfer(worker, _amount),
            "USDC payment failed"
        );
        
        emit PartialPaymentReleased(worker, _amount);
        
        if (isCompleted) {
            emit EscrowCompleted();
        }
    }
    
    /**
     * @dev Raise a dispute
     */
    function raiseDispute() external onlyMarketplace notCompleted {
        require(!isDisputed, "Already disputed");
        isDisputed = true;
        emit DisputeRaised();
    }
}
