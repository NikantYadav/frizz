/**
 * Quantum Randomness Oracle Service
 * 
 * This service listens for RandomnessRequested events from the QuantumRandomnessOracle
 * contract, fetches quantum random numbers from ANU API, and fulfills the requests.
 * 
 * Setup:
 * 1. Get free API key from https://quantumnumbers.anu.edu.au
 * 2. Set environment variables: ANU_API_KEY, ORACLE_CONTRACT_ADDRESS, PRIVATE_KEY
 * 3. Run: node scripts/quantum-oracle-service.js
 */

const { ethers } = require("hardhat");
const axios = require("axios");

// Configuration
const ANU_API_URL = "https://api.quantumnumbers.anu.edu.au";
const ANU_API_KEY = process.env.ANU_API_KEY;
const ORACLE_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS;
const POLL_INTERVAL = 5000; // 5 seconds

// Oracle ABI (minimal)
const ORACLE_ABI = [
  "event RandomnessRequested(bytes32 indexed requestId, address indexed requester, uint256 timestamp)",
  "function fulfillRandomness(bytes32 requestId, uint256 randomNumber) external",
  "function isRandomNumberReady(bytes32 requestId) external view returns (bool)"
];

async function fetchQuantumRandomNumber() {
  try {
    const response = await axios.get(ANU_API_URL, {
      params: {
        length: 1,
        type: "uint16" // Returns 0-65535
      },
      headers: {
        "x-api-key": ANU_API_KEY
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Scale up the uint16 value to uint256 range for better distribution
      const baseRandom = response.data.data[0];
      
      // Fetch multiple numbers for better entropy
      const response2 = await axios.get(ANU_API_URL, {
        params: { length: 4, type: "uint16" },
        headers: { "x-api-key": ANU_API_KEY }
      });

      if (response2.data && response2.data.data) {
        // Combine multiple quantum random numbers
        const numbers = response2.data.data;
        const combined = ethers.solidityPackedKeccak256(
          ["uint256", "uint256", "uint256", "uint256"],
          numbers
        );
        return ethers.toBigInt(combined);
      }

      return BigInt(baseRandom);
    }

    throw new Error("Invalid response from ANU API");
  } catch (error) {
    console.error("Error fetching quantum random number:", error.message);
    
    // Fallback to enhanced pseudo-random
    console.log("Using fallback pseudo-random");
    return ethers.toBigInt(ethers.randomBytes(32));
  }
}

async function fulfillRequest(oracle, requestId, signer) {
  try {
    console.log(`Fetching quantum random number for request ${requestId}...`);
    const randomNumber = await fetchQuantumRandomNumber();
    
    console.log(`Fulfilling request ${requestId} with random number: ${randomNumber}`);
    const tx = await oracle.connect(signer).fulfillRandomness(requestId, randomNumber);
    await tx.wait();
    
    console.log(`✓ Request ${requestId} fulfilled in tx: ${tx.hash}`);
    return true;
  } catch (error) {
    console.error(`Error fulfilling request ${requestId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("Starting Quantum Randomness Oracle Service...");
  
  // Validate configuration
  if (!ANU_API_KEY) {
    console.error("ERROR: ANU_API_KEY environment variable not set");
    console.log("Get your free API key at: https://quantumnumbers.anu.edu.au");
    process.exit(1);
  }

  if (!ORACLE_ADDRESS) {
    console.error("ERROR: ORACLE_CONTRACT_ADDRESS environment variable not set");
    process.exit(1);
  }

  // Setup provider and signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);

  // Connect to oracle contract
  const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);
  console.log(`Connected to oracle at: ${ORACLE_ADDRESS}`);

  // Track processed requests
  const processedRequests = new Set();

  // Listen for RandomnessRequested events
  console.log("Listening for RandomnessRequested events...\n");
  
  oracle.on("RandomnessRequested", async (requestId, requester, timestamp, event) => {
    console.log(`\n📡 New randomness request detected:`);
    console.log(`  Request ID: ${requestId}`);
    console.log(`  Requester: ${requester}`);
    console.log(`  Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);

    // Avoid duplicate processing
    if (processedRequests.has(requestId)) {
      console.log(`  ⚠ Already processed, skipping`);
      return;
    }

    processedRequests.add(requestId);

    // Check if already fulfilled
    try {
      const isReady = await oracle.isRandomNumberReady(requestId);
      if (isReady) {
        console.log(`  ⚠ Already fulfilled, skipping`);
        return;
      }
    } catch (error) {
      console.log(`  ⚠ Error checking status: ${error.message}`);
    }

    // Fulfill the request
    await fulfillRequest(oracle, requestId, signer);
  });

  // Keep the service running
  console.log("Service is running. Press Ctrl+C to stop.\n");
  
  // Periodic health check
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Service active, processed ${processedRequests.size} requests`);
  }, 60000); // Every minute
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\nShutting down oracle service...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\nShutting down oracle service...");
  process.exit(0);
});

// Run the service
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
