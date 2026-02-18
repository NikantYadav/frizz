# Decentralized Work Marketplace - Frizz

A secure, decentralized freelance marketplace with built-in escrow and dispute resolution powered by a staked juror arbitration system.

## 🎯 Overview

This project implements a complete decentralized work marketplace (dApp) based on the TODO.md specifications, featuring:

- **Job Marketplace**: Post jobs, receive applications, select workers
- **Escrow System**: Secure payment holding with milestone support
- **Dispute Resolution**: Kleros-inspired staked juror arbitration
- **Security**: OpenZeppelin contracts with ReentrancyGuard and access control

## 🏗️ Architecture

### Smart Contracts

1. **ArbitrationToken.sol** - ERC20 token for juror staking
2. **JobEscrow.sol** - Individual escrow contracts per job (factory pattern)
3. **Arbitration.sol** - Staked juror system with voting and rewards
4. **JobMarketplace.sol** - Main contract coordinating all components

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy System
```bash
npx hardhat ignition deploy ignition/modules/JobMarketplaceSystem.ts --network hardhatMainnet
```

### Run Demo Script
```bash
npx hardhat run scripts/interact-job-marketplace.ts --network hardhatMainnet
```

## 📚 Documentation

See [MARKETPLACE_README.md](./MARKETPLACE_README.md) for complete documentation including:
- Detailed architecture
- User flows (Client, Worker, Juror)
- Security features
- API reference
- Frontend integration guide
- IPFS integration

## ✅ Test Results

All 23 tests passing:
- 3 Solidity tests (Counter example)
- 20 Mocha tests (JobMarketplace system)

Coverage includes:
- Job posting and applications
- Escrow and worker selection
- Work submission and payment
- Milestone system
- Arbitration and dispute resolution
- Security features (reentrancy, access control)

## 🔐 Security Features

- ✅ OpenZeppelin ReentrancyGuard
- ✅ Checks-Effects-Interactions pattern
- ✅ Access control modifiers
- ✅ Pull over push payments
- ✅ Immutable critical addresses
- ✅ Safe math (Solidity 0.8+)

## 📝 Key Features Implemented

### From TODO.md Requirements

✅ Wallet integration (client & worker addresses)  
✅ Job posting with title, description, skills, budget, category  
✅ Job broadcasting to workers  
✅ Worker applications with cover letters (IPFS hashes)  
✅ Smart contract escrow with funding  
✅ Milestone support (optional)  
✅ Worker selection by client  
✅ Work submission (IPFS hashes)  
✅ Payment release on acceptance  
✅ Dispute resolution system  
✅ Staked juror pool by category  
✅ Random juror selection (3 initial)  
✅ Voting mechanism with majority wins  
✅ Reward distribution to majority jurors  
✅ Slashing minority jurors (10% stake)  
✅ Appeal process (+2 jurors per appeal)  
✅ Arbitration fees distribution  

## 🛠️ Technology Stack

- Solidity 0.8.28
- Hardhat 3
- OpenZeppelin Contracts
- Ethers.js v6
- TypeScript
- Mocha/Chai

## 📄 License

MIT
