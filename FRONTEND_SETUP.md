# Frontend Setup Guide

Complete guide to set up and run the Frizz Marketplace frontend.

## 🎯 Quick Start (5 minutes)

### 1. Start Hardhat Node

```bash
# Terminal 1 - In project root
npx hardhat node
```

Keep this running. Note the contract addresses from deployment.

### 2. Deploy Contracts

```bash
# Terminal 2 - In project root
npx hardhat ignition deploy ignition/modules/JobMarketplaceSystem.ts --network hardhatMainnet
```

Copy the deployed contract addresses.

### 3. Update Frontend Configuration

```bash
# Navigate to frontend
cd frontend

# Copy environment template
cp .env.example .env

# Edit frontend/src/lib/contracts.ts with your addresses
```

Update the CONTRACT_ADDRESSES in `frontend/src/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  JobMarketplace: '0xYourDeployedAddress',  // From step 2
  Arbitration: '0xYourDeployedAddress',
  ArbitrationToken: '0xYourDeployedAddress',
};
```

### 4. Install and Run

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

### 5. Connect Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask
4. Switch to "Localhost 8545" network in MetaMask
5. Import test account from Hardhat node

## 📱 Using the Application

### As a Client (Job Poster)

1. **Connect Wallet** - Click "Connect Wallet" button
2. **Post a Job**
   - Click "Post Job" button
   - Fill in:
     - Title: "Build a DeFi Dashboard"
     - Description: "Need a React dashboard..."
     - Skills: "React, TypeScript, Web3"
     - Category: "Development"
     - Budget: "5" (ETH)
   - Click "Post Job"
   - Approve transaction in MetaMask
   - Wait for confirmation

3. **View Your Jobs**
   - Click "My Jobs" tab
   - See all jobs you've posted

4. **Manage Applications**
   - Click on a job card
   - View worker applications
   - Select a worker
   - Fund escrow
   - Accept completed work

### As a Worker (Freelancer)

1. **Connect Wallet** - Use a different account
2. **Browse Jobs**
   - View all available jobs
   - Filter by category
   - Click job card for details

3. **Apply to Job**
   - Click "Apply Now"
   - Submit cover letter (IPFS hash)
   - Submit work history (IPFS hash)
   - Approve transaction

4. **Track Applications**
   - Click "My Applications" tab
   - See all jobs you've applied to
   - Submit work when selected
   - Receive payment

### As a Juror

1. **Stake Tokens**
   - Get ARB tokens from deployer
   - Approve token spending
   - Stake 100 ARB tokens
   - Select expertise categories

2. **Vote on Disputes**
   - View active disputes
   - Review evidence
   - Cast vote
   - Earn rewards

## 🔧 Advanced Configuration

### Custom Network

Edit `frontend/src/app/providers.tsx`:

```typescript
import { sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'Frizz Marketplace',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia], // Change network here
  ssr: true,
});
```

### WalletConnect Setup

1. Go to https://cloud.walletconnect.com
2. Create account and project
3. Copy Project ID
4. Update in `frontend/src/app/providers.tsx`:

```typescript
projectId: 'YOUR_ACTUAL_PROJECT_ID',
```

### IPFS Integration (Optional)

For production, integrate IPFS for storing:
- Cover letters
- Work history
- Work submissions

```bash
npm install ipfs-http-client
```

Create `frontend/src/lib/ipfs.ts`:

```typescript
import { create } from 'ipfs-http-client';

const client = create({ url: 'https://ipfs.infura.io:5001' });

export async function uploadToIPFS(content: string) {
  const { cid } = await client.add(content);
  return cid.toString();
}
```

## 🎨 Customization

### Theme Colors

Edit `frontend/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#YOUR_COLOR',
        600: '#YOUR_COLOR',
        // ... more shades
      },
    },
  },
},
```

### Logo and Branding

1. Add logo to `frontend/public/logo.png`
2. Update `frontend/src/components/Navbar.tsx`:

```typescript
<Image src="/logo.png" alt="Logo" width={32} height={32} />
```

### Add More Features

Create new components in `frontend/src/components/`:
- `DisputeModal.tsx` - Dispute resolution interface
- `MilestoneManager.tsx` - Milestone management
- `JurorDashboard.tsx` - Juror voting interface
- `ProfilePage.tsx` - User profiles
- `NotificationsPanel.tsx` - Real-time notifications

## 📊 Testing

### Test Accounts

Use Hardhat's default accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Client)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Worker)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Juror)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### Test Workflow

1. **Post Job** (Account #0)
2. **Apply to Job** (Account #1)
3. **Fund Escrow** (Account #0)
4. **Select Worker** (Account #0)
5. **Submit Work** (Account #1)
6. **Accept Work** (Account #0)
7. **Payment Released** ✅

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

### Environment Variables on Vercel

Add these in Vercel dashboard:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_JOB_MARKETPLACE_ADDRESS`
- `NEXT_PUBLIC_ARBITRATION_ADDRESS`
- `NEXT_PUBLIC_TOKEN_ADDRESS`

### Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records
3. Enable HTTPS

## 🐛 Common Issues

### "Cannot read properties of undefined"

**Solution**: Ensure contracts are deployed and addresses are correct in `contracts.ts`

### "User rejected transaction"

**Solution**: Normal - user cancelled in MetaMask

### "Insufficient funds"

**Solution**: Ensure account has enough ETH for gas + transaction value

### "Network mismatch"

**Solution**: Switch MetaMask to correct network (Localhost 8545 for local development)

### Build fails with "Module not found"

**Solution**:
```bash
rm -rf node_modules .next
npm install
npm run build
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)
- [Wagmi Documentation](https://wagmi.sh/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Ethers.js](https://docs.ethers.org/)

## 🎉 Success!

Your frontend is now running! You should see:
- ✅ Wallet connection working
- ✅ Jobs loading from blockchain
- ✅ Transactions submitting successfully
- ✅ Responsive design on mobile

---

**Need Help?** Check the main README.md or open an issue on GitHub.
