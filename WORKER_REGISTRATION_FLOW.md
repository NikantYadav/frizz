# Worker Registration Flow with EIP-712 Signatures

## Overview

WorkerRegistry now uses EIP-712 signatures to prevent spam registrations. Only workers who pass captcha verification on the frontend can register.

## Architecture

```
User → Frontend (Captcha) → Backend API → Signs EIP-712 → Frontend → Smart Contract
```

## Flow

### 1. Frontend: User Initiates Registration

```javascript
// User fills out profile form
const profileData = {
  workerAddress: userWallet.address,
  ipfsHash: uploadedProfileCID, // Upload to IPFS first
  hourlyRate: "50000000" // 50 USDC (6 decimals)
};

// Show captcha
const captchaToken = await verifyCaptcha();
```

### 2. Frontend: Request Signature from Backend

```javascript
// Call your backend API
const response = await fetch('/api/worker/register-signature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workerAddress: profileData.workerAddress,
    ipfsHash: cidToBytes32(profileData.ipfsHash),
    hourlyRate: profileData.hourlyRate,
    captchaToken: captchaToken
  })
});

const { signature, nonce, deadline } = await response.json();
```

### 3. Backend: Verify Captcha & Sign

```javascript
const express = require('express');
const { signWorkerRegistration } = require('./signWorkerRegistration');

app.post('/api/worker/register-signature', async (req, res) => {
  const { workerAddress, ipfsHash, hourlyRate, captchaToken } = req.body;
  
  // 1. Verify captcha (Google reCAPTCHA, hCaptcha, etc.)
  const captchaValid = await verifyCaptchaToken(captchaToken);
  if (!captchaValid) {
    return res.status(400).json({ error: 'Captcha verification failed' });
  }
  
  // 2. Get current nonce from contract
  const nonce = await workerRegistry.nonces(workerAddress);
  
  // 3. Set deadline (e.g., 1 hour from now)
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  
  // 4. Generate EIP-712 signature
  const signature = await signWorkerRegistration(
    process.env.SIGNER_PRIVATE_KEY,
    workerAddress,
    ipfsHash,
    hourlyRate,
    nonce,
    deadline
  );
  
  res.json({ signature, nonce, deadline });
});
```

### 4. Frontend: Submit to Smart Contract

```javascript
// Call smart contract with signature
const tx = await workerRegistry.registerProfile(
  ipfsHashBytes32,
  hourlyRate,
  deadline,
  signature
);

await tx.wait();
console.log('Worker registered successfully!');
```

## IPFS Hash Conversion

WorkerRegistry stores IPFS hashes as `bytes32` to save gas. You need to convert CIDs:

### JavaScript (Frontend/Backend)

```javascript
const bs58 = require('bs58');

// CID to bytes32 (remove 0x1220 prefix)
function cidToBytes32(cid) {
  const decoded = bs58.decode(cid);
  const hash = decoded.slice(2); // Remove multihash prefix
  return '0x' + Buffer.from(hash).toString('hex');
}

// bytes32 to CID (add 0x1220 prefix)
function bytes32ToCid(bytes32Hash) {
  const hashHex = bytes32Hash.replace('0x', '');
  const multihash = Buffer.from('1220' + hashHex, 'hex');
  return bs58.encode(multihash);
}
```

### Solidity (Reading from Contract)

```solidity
// Read bytes32 from contract
bytes32 ipfsHash = workerRegistry.profiles(workerAddress).ipfsHash;

// Convert to CID off-chain using bytes32ToCid()
```

## Security Features

### 1. Replay Protection
- Each signature includes a `nonce`
- Nonce increments after each registration
- Old signatures cannot be reused

### 2. Signature Expiry
- Each signature includes a `deadline` timestamp
- Signatures expire after deadline (typically 1 hour)
- Prevents stale signatures from being used months later
- Backend controls expiry window

**Recommended Deadline Values:**
- **Short-lived (1 hour)**: Best for production - `Date.now() / 1000 + 3600`
- **Medium (24 hours)**: For testing - `Date.now() / 1000 + 86400`
- **Long (7 days)**: Only for development - `Date.now() / 1000 + 604800`

**Why Deadlines Matter:**
- Without deadline: User gets signature today, uses it 6 months later
- With deadline: Signature becomes invalid after expiry
- Prevents: Stale data, outdated pricing, changed policies
- Forces: Fresh captcha verification for each registration attempt

### 3. Captcha Verification
- Backend verifies captcha before signing
- Prevents bot spam registrations
- Rate limiting on backend API

### 4. EIP-712 Typed Data
- Human-readable signature data
- Prevents phishing attacks
- Wallet shows exactly what user is signing

## Gas Optimizations

### O(1) Active Worker Count
```solidity
// Old: O(n) loop through all workers
function getActiveWorkerCount() external view returns (uint256) {
  uint256 count = 0;
  for (uint256 i = 0; i < allWorkers.length; i++) {
    if (profiles[allWorkers[i]].isActive) count++;
  }
  return count;
}

// New: O(1) counter
uint256 public activeWorkerCount; // Updated on register/deregister
```

### bytes32 vs string Storage
- `string ipfsHash`: ~20,000+ gas (variable length)
- `bytes32 ipfsHash`: 32 bytes fixed = ~5,000 gas
- **75% gas savings**

### No On-Chain Skill Storage
- Skills stored only in IPFS metadata
- Eliminates redundant storage
- Off-chain indexing via events

## Deployment

### 1. Deploy WorkerRegistry

```javascript
const WorkerRegistry = await ethers.getContractFactory("WorkerRegistry");
const registrationSigner = "0x..."; // Backend signer address
const admin = "0x..."; // Admin address (use multisig in production)
const workerRegistry = await WorkerRegistry.deploy(registrationSigner, admin);
```

**Important:** In production, use a multisig wallet (e.g., Gnosis Safe) for the `admin` address.

### 2. Update Backend Config

```javascript
// .env
SIGNER_PRIVATE_KEY=0x...
WORKER_REGISTRY_ADDRESS=0x...
CHAIN_ID=1
```

### 3. Update Frontend Config

```javascript
const WORKER_REGISTRY_ADDRESS = "0x...";
const BACKEND_API_URL = "https://api.yourapp.com";
```

## Updating Signer (2-Step Transfer)

If you need to rotate the backend signer (e.g., key compromise, server migration):

### Step 1: Admin Proposes New Signer

```javascript
// Only admin (multisig) can propose
await workerRegistry.connect(admin).proposeSignerUpdate(newSignerAddress);
```

### Step 2: New Signer Accepts Role

```javascript
// New signer must explicitly accept
await workerRegistry.connect(newSigner).acceptSignerRole();
```

**Why 2-Step Transfer?**

- **Prevents Accidents**: New signer must explicitly accept
- **Prevents Takeover**: If signer key is compromised, attacker cannot rotate to their own address without admin approval
- **Separation of Concerns**: Admin (multisig) proposes, new signer accepts
- **Safety Net**: Admin can propose different signer if first choice is wrong

**Security Model:**

```
┌─────────────────────────────────────────────────────────┐
│  Admin (Multisig)                                       │
│  - Proposes signer changes                              │
│  - Cannot sign registrations                            │
│  - Should be 3-of-5 or 2-of-3 multisig                 │
└─────────────────────────────────────────────────────────┘
                    │
                    │ proposeSignerUpdate()
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Pending Signer                                         │
│  - Must explicitly accept role                          │
│  - Cannot be forced into role                           │
└─────────────────────────────────────────────────────────┘
                    │
                    │ acceptSignerRole()
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Registration Signer (Backend)                          │
│  - Signs worker registrations after captcha             │
│  - Cannot change itself                                 │
│  - Cannot change admin                                  │
└─────────────────────────────────────────────────────────┘
```

### Transfer Admin Role

```javascript
// Only current admin can transfer (use multisig vote)
await workerRegistry.connect(admin).transferAdmin(newAdminAddress);
```

**Production Recommendation**: 
- Use Gnosis Safe or similar multisig for admin
- Require 2-of-3 or 3-of-5 signatures for admin actions
- Keep signer key in secure backend environment (AWS KMS, HashiCorp Vault, etc.)

## Example: Complete Registration Flow

```javascript
// 1. Upload profile to IPFS
const profileMetadata = {
  bio: "Experienced Solidity developer",
  skills: ["Solidity", "React", "Node.js"],
  portfolio: "https://...",
  github: "https://github.com/..."
};
const ipfsCid = await uploadToIPFS(profileMetadata);

// 2. Convert CID to bytes32
const ipfsHashBytes32 = cidToBytes32(ipfsCid);

// 3. Verify captcha
const captchaToken = await grecaptcha.execute();

// 4. Request signature from backend
const { signature, deadline } = await fetch('/api/worker/register-signature', {
  method: 'POST',
  body: JSON.stringify({
    workerAddress: userAddress,
    ipfsHash: ipfsHashBytes32,
    hourlyRate: "50000000", // 50 USDC
    captchaToken
  })
}).then(r => r.json());

// 5. Register on-chain
const tx = await workerRegistry.registerProfile(
  ipfsHashBytes32,
  "50000000",
  deadline,
  signature
);
await tx.wait();

console.log('✅ Worker registered!');
```

## Testing

```javascript
// Get nonce
const nonce = await workerRegistry.nonces(workerAddress);

// Get domain separator
const domainSeparator = await workerRegistry.getDomainSeparator();

// Check if worker is active
const isActive = await workerRegistry.isActiveWorker(workerAddress);

// Get active worker count (O(1))
const activeCount = await workerRegistry.activeWorkerCount();

// Check admin and signer
const admin = await workerRegistry.admin();
const signer = await workerRegistry.registrationSigner();
const pendingSigner = await workerRegistry.pendingSigner();
```

## Security Considerations

### Key Management

**Registration Signer (Backend):**
- Store private key in secure environment (AWS KMS, HashiCorp Vault, Azure Key Vault)
- Never commit to git or expose in logs
- Rotate periodically (every 90 days recommended)
- Monitor for unusual signing activity

**Admin (Multisig):**
- Use Gnosis Safe or similar multisig wallet
- Require multiple signatures (2-of-3 or 3-of-5)
- Distribute keys across different team members
- Use hardware wallets for multisig signers

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|-----------|
| **Signer Key Compromise** | 2-step transfer prevents attacker from rotating signer. Admin (multisig) must approve new signer. |
| **Replay Attack** | Nonce increments after each registration. Old signatures cannot be reused. |
| **Stale Signature** | Deadline timestamp expires signatures after 1 hour. Forces fresh captcha verification. |
| **Bot Spam** | Backend verifies captcha before signing. Rate limiting on API. |
| **Admin Key Compromise** | Use multisig requiring multiple signatures. No single point of failure. |
| **Signature Forgery** | EIP-712 cryptographic verification. Only valid signer can create signatures. |

### Monitoring & Alerts

Set up alerts for:
- Unusual number of registrations (potential bot attack)
- Failed signature verifications (potential attack attempt)
- Signer update proposals (security-critical operation)
- Admin transfers (security-critical operation)

### Incident Response

**If Signer Key is Compromised:**
1. Admin immediately proposes new signer via multisig
2. New signer accepts role
3. Old signer key is revoked
4. Investigate how compromise occurred
5. Review recent registrations for suspicious activity

**If Admin Key is Compromised:**
- If using multisig: Revoke compromised signer from multisig
- If single admin: Deploy new contract (last resort)
- This is why multisig is critical for production
