// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title JobEscrow
 * @dev Handles escrow for individual jobs using USDC
 * Uses factory pattern - one escrow per job
 */
contract JobEscrow is ReentrancyGuard {
    IERC20 public immutable usdc;
    address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    address public immutable client;
    address public worker;
    address public marketplace;
    uint256 public totalBudget;
    uint256 public lockedAmount;
    uint256 public releasedAmount;
    bool public isDisputed;
    
    event Funded(uint256 amount);
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
        usdc = IERC20(USDC_ADDRESS);
    }
    
    /**
     * @dev Fund the escrow from marketplace (called during creation)
     * Marketplace transfers USDC before calling this
     */
    function fundFromMarketplace() external onlyMarketplace {
        require(lockedAmount == 0, "Already funded");
        
        lockedAmount = totalBudget;
        emit Funded(totalBudget);
    }
    
    /**
     * @dev Set the selected worker
     */
    function setWorker(address _worker) external onlyMarketplace {
        require(worker == address(0), "Worker already set");
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
        nonReentrant 
    {
        require(lockedAmount > 0, "No funds locked");
        require(worker != address(0), "No worker selected");
        
        // Effects
        uint256 amount = lockedAmount;
        lockedAmount = 0;
        releasedAmount += amount;
        
        // Interactions - transfer USDC
        require(
            usdc.transfer(worker, amount),
            "USDC transfer failed"
        );
        
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
        
        // Interactions - transfer USDC
        require(
            usdc.transfer(client, _amount),
            "USDC refund failed"
        );
        
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
        
        // Interactions - transfer USDC
        require(
            usdc.transfer(worker, _amount),
            "USDC payment failed"
        );
    }
    
    /**
     * @dev Raise a dispute
     */
    function raiseDispute() external onlyMarketplace {
        isDisputed = true;
        emit DisputeRaised();
    }
}
