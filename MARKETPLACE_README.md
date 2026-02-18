# Decentralized Work Marketplace dApp

A secure, decentralized marketplace for freelance work with built-in escrow and dispute resolution powered by a staked juror system.

## 🏗️ Architecture Overview

The system consists of 4 main smart contracts implementing a complete work marketplace with arbitration:

### 1. **ArbitrationToken.sol** (ERC20)
- Governance token for the arbitration system
- Used for juror staking
- Rewards distributed to honest jurors
- Slashing mechanism for dishonest jurors

### 2. **JobEscrow.sol** (Factory Pattern)
- One escrow contract per job
- Holds funds securely until work completion
- Supports milestone-based payments
- Implements checks-effects-interactions pattern
- Protected by ReentrancyGuard

### 3. **Arbitration.sol** (Kleros-Inspired)
- Staked juror system
- Category-based juror filtering
- Random juror selection
- Voting mechanism with rewards
- Appeal system with incremental jurors
- Slashing for minority voters

### 4. **JobMarketplace.sol** (Main Contract)
- Job posting and broadcasting
- Worker applications
- Escrow creation and management
- Work submission (IPFS hashes)
- Payment release
- Dispute initiation and resolution

## 🔐 Security Features

### OpenZeppelin Integration
- **ReentrancyGuard**: Prevents reentrancy attacks on payment functions
- **Ownable**: Access control for administrative functions
- **ERC20**: Standard token implementation

### Security Patterns
- ✅ Checks-Effects-Interactions pattern
- ✅ Pull over push payments
- ✅ Access control modifiers
- ✅ Input validation
- ✅ Immutable critical addresses
- ✅ Safe math (Solidity 0.8+)

### Audit Considerations
- All external calls use low-level `call` with success checks
- State changes before external calls
- No delegatecall usage
- Clear separation of concerns
- Event emission for all state changes

## 📋 User Flows

### Client Flow
1. **Post Job**: Create job with title, description, skills, category, budget
2. **Fund Escrow**: Lock payment in escrow contract
3. **Review Applications**: View worker applications with cover letters
4. **Select Worker**: Choose worker from applicants
5. **Add Milestones** (Optional): Define payment milestones
6. **Accept Work**: Release payment when satisfied
7. **Raise Dispute** (If needed): Initiate arbitration

### Worker Flow
1. **Browse Jobs**: Filter by category/skills
2. **Apply**: Submit cover letter and work history (IPFS)
3. **Complete Work**: Deliver work product
4. **Submit Work**: Upload work (IPFS hash)
5. **Receive Payment**: Get paid upon acceptance
6. **Raise Dispute** (If needed): Contest rejection

### Juror Flow
1. **Stake Tokens**: Lock ARB tokens to become juror
2. **Select Categories**: Choose expertise areas
3. **Get Selected**: Random selection for disputes
4. **Review Evidence**: Examine submitted work
5. **Vote**: Cast vote for client or worker
6. **Earn Rewards**: Receive fees + slashed stakes if in majority

## 🎯 Dispute Resolution

### Process
1. Either party raises dispute (pays arbitration fee)
2. System selects 3 jurors from category pool
3. Jurors review evidence and vote
4. Majority decision wins
5. Winning jurors receive:
   - Arbitration fees
   - 10% of losing jurors' stakes

### Appeal System
- Either party can appeal
- Adds 2 more jurors
- New vote with 5 jurors
- Can appeal multiple times
- Higher juror count = more expensive

## 🚀 Deployment

### Prerequisites
```bash
npm install
```

### Deploy All Contracts
```bash
npx hardhat ignition deploy ignition/modules/JobMarketplaceSystem.ts --network localhost
```

### Deploy to Testnet (e.g., Sepolia)
```bash
npx hardhat ignition deploy ignition/modules/JobMarketplaceSystem.ts --network sepolia
```

## 🧪 Testing

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test File
```bash
npx hardhat test test/JobMarketplace.ts
```

### Test Coverage
```bash
npx hardhat coverage
```

## 📝 Interaction Scripts

### Full System Demo
```bash
npx hardhat run scripts/interact-job-marketplace.ts --network localhost
```

This script demonstrates:
- Token distribution
- Juror staking
- Job posting
- Worker applications
- Escrow funding
- Worker selection
- Work submission
- Payment release
- Dispute creation
- Juror voting
- Dispute resolution

## 📊 Contract Addresses (After Deployment)

Update these after deployment:

```
ArbitrationToken: 0x...
Arbitration: 0x...
JobMarketplace: 0x...
```

## 🔧 Configuration

### Arbitration Parameters
- **Stake Amount**: 100 ARB tokens
- **Arbitration Fee**: 0.01 ETH
- **Initial Jurors**: 3
- **Appeal Increment**: +2 jurors
- **Slash Percentage**: 10% of stake

### Modifying Parameters
Edit constants in `contracts/Arbitration.sol`:
```solidity
uint256 public constant STAKE_AMOUNT = 100 * 10**18;
uint256 public constant ARBITRATION_FEE = 0.01 ether;
uint256 public constant INITIAL_JUROR_COUNT = 3;
uint256 public constant APPEAL_JUROR_INCREMENT = 2;
```

## 📱 Frontend Integration

### Key Functions

#### Post Job
```javascript
await jobMarketplace.postJob(
  "Job Title",
  "Description",
  "Skills",
  "Category",
  ethers.parseEther("5")
);
```

#### Apply to Job
```javascript
await jobMarketplace.applyToJob(
  jobId,
  "QmIPFSCoverLetterHash",
  "QmIPFSWorkHistoryHash"
);
```

#### Fund Escrow
```javascript
await jobMarketplace.createAndFundEscrow(jobId, {
  value: ethers.parseEther("5")
});
```

#### Submit Work
```javascript
await jobMarketplace.submitWork(jobId, "QmIPFSWorkHash");
```

#### Accept and Pay
```javascript
await jobMarketplace.acceptWorkAndPay(jobId);
```

### Events to Listen
```javascript
jobMarketplace.on("JobPosted", (jobId, client, title, category, budget) => {
  console.log(`New job: ${title}`);
});

jobMarketplace.on("ApplicationSubmitted", (jobId, worker) => {
  console.log(`New application for job ${jobId}`);
});

jobMarketplace.on("DisputeRaised", (jobId, disputeId) => {
  console.log(`Dispute raised for job ${jobId}`);
});
```

## 🗂️ IPFS Integration

Store off-chain data on IPFS:
- Cover letters
- Work history
- Work submissions
- Evidence files

### Example with ipfs-http-client
```javascript
import { create } from 'ipfs-http-client';

const client = create({ url: 'https://ipfs.infura.io:5001' });

// Upload cover letter
const coverLetter = "I am experienced in...";
const { cid } = await client.add(coverLetter);
const hash = cid.toString();

// Use hash in application
await jobMarketplace.applyToJob(jobId, hash, workHistoryHash);
```

## 🔍 Querying Data

### Get Active Jobs
```javascript
const activeJobIds = await jobMarketplace.getActiveJobs();
```

### Get Jobs by Category
```javascript
const devJobs = await jobMarketplace.getJobsByCategory("Development");
```

### Get Applications
```javascript
const applications = await jobMarketplace.getApplications(jobId);
```

### Get Job Details
```javascript
const job = await jobMarketplace.getJob(jobId);
console.log(job.title, job.budget, job.selectedWorker);
```

## ⚠️ Important Notes

### Randomness
Current implementation uses pseudo-random juror selection. For production:
- Integrate [Chainlink VRF](https://docs.chain.link/vrf/v2/introduction) for true randomness
- Prevents juror selection manipulation

### Gas Optimization
- Batch operations where possible
- Use events for historical data
- Consider L2 deployment (Optimism, Arbitrum)

### Upgradability
Current contracts are not upgradeable. For production:
- Consider using OpenZeppelin's proxy patterns
- Implement emergency pause functionality
- Add governance for parameter changes

## 🛡️ Security Recommendations

1. **Audit**: Get professional security audit before mainnet
2. **Bug Bounty**: Run bug bounty program
3. **Gradual Rollout**: Start with low limits
4. **Insurance**: Consider smart contract insurance
5. **Monitoring**: Set up event monitoring and alerts

## 📚 Additional Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Kleros Documentation](https://kleros.io/docs/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Open GitHub issue
- Check existing documentation
- Review test files for examples

---

**⚠️ Disclaimer**: This is a demonstration project. Conduct thorough testing and security audits before using in production with real funds.
