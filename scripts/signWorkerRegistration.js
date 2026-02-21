/**
 * Helper script to generate EIP-712 signatures for worker registration
 * This would be used by your backend after captcha verification
 */

const { ethers } = require("ethers");

// EIP-712 Domain
const domain = {
  name: "WorkerRegistry",
  version: "1",
  chainId: 1, // Update based on network (1 for mainnet, 11155111 for sepolia, etc.)
  verifyingContract: "0x..." // WorkerRegistry contract address
};

// EIP-712 Types
const types = {
  RegisterWorker: [
    { name: "worker", type: "address" },
    { name: "ipfsHash", type: "bytes32" },
    { name: "hourlyRate", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ]
};

/**
 * Generate signature for worker registration
 * @param {string} signerPrivateKey - Backend signer's private key
 * @param {string} workerAddress - Worker's wallet address
 * @param {string} ipfsHash - IPFS multihash digest (bytes32)
 * @param {string} hourlyRate - Hourly rate in USDC (6 decimals)
 * @param {number} nonce - Current nonce for the worker
 * @param {number} deadline - Signature expiry timestamp (unix timestamp)
 * @returns {string} EIP-712 signature
 */
async function signWorkerRegistration(
  signerPrivateKey,
  workerAddress,
  ipfsHash,
  hourlyRate,
  nonce,
  deadline
) {
  const wallet = new ethers.Wallet(signerPrivateKey);

  const value = {
    worker: workerAddress,
    ipfsHash: ipfsHash,
    hourlyRate: hourlyRate,
    nonce: nonce,
    deadline: deadline
  };

  const signature = await wallet.signTypedData(domain, types, value);
  return signature;
}

/**
 * Convert IPFS CID to bytes32 (remove 0x1220 prefix)
 * @param {string} cid - IPFS CID (e.g., "QmXxx...")
 * @returns {string} bytes32 hash
 */
function cidToBytes32(cid) {
  // Decode base58 CID
  const bs58 = require("bs58");
  const decoded = bs58.decode(cid);
  
  // Remove first 2 bytes (0x12 0x20 - multihash prefix)
  const hash = decoded.slice(2);
  
  // Convert to hex string
  return "0x" + Buffer.from(hash).toString("hex");
}

/**
 * Convert bytes32 back to IPFS CID
 * @param {string} bytes32Hash - bytes32 hash
 * @returns {string} IPFS CID
 */
function bytes32ToCid(bytes32Hash) {
  const bs58 = require("bs58");
  
  // Remove 0x prefix
  const hashHex = bytes32Hash.replace("0x", "");
  
  // Add multihash prefix (0x1220 for sha2-256)
  const multihash = Buffer.from("1220" + hashHex, "hex");
  
  // Encode to base58
  return bs58.encode(multihash);
}

// Example usage
async function example() {
  const signerPrivateKey = "0x..."; // Backend signer private key
  const workerAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const ipfsCid = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const ipfsHash = cidToBytes32(ipfsCid);
  const hourlyRate = "50000000"; // 50 USDC (6 decimals)
  const nonce = 0; // Get from contract: await workerRegistry.nonces(workerAddress)
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  const signature = await signWorkerRegistration(
    signerPrivateKey,
    workerAddress,
    ipfsHash,
    hourlyRate,
    nonce,
    deadline
  );

  console.log("Signature:", signature);
  console.log("IPFS Hash (bytes32):", ipfsHash);
  console.log("Recovered CID:", bytes32ToCid(ipfsHash));
  console.log("Deadline:", new Date(deadline * 1000).toISOString());
}

module.exports = {
  signWorkerRegistration,
  cidToBytes32,
  bytes32ToCid
};
