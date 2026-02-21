const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Quantum Randomness Oracle and Arbitration contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy Quantum Randomness Oracle
  console.log("1. Deploying QuantumRandomnessOracle...");
  const QuantumRandomnessOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
  const oracle = await QuantumRandomnessOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✓ QuantumRandomnessOracle deployed to:", oracleAddress);

  // 2. Deploy ArbitrationToken (if not already deployed)
  console.log("\n2. Deploying ArbitrationToken...");
  const ArbitrationToken = await ethers.getContractFactory("ArbitrationToken");
  const token = await ArbitrationToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✓ ArbitrationToken deployed to:", tokenAddress);

  // 3. Deploy Arbitration with oracle
  console.log("\n3. Deploying Arbitration contract...");
  const Arbitration = await ethers.getContractFactory("Arbitration");
  const arbitration = await Arbitration.deploy(tokenAddress, oracleAddress);
  await arbitration.waitForDeployment();
  const arbitrationAddress = await arbitration.getAddress();
  console.log("✓ Arbitration deployed to:", arbitrationAddress);

  // 4. Authorize arbitration contract as oracle fulfiller (optional, for testing)
  console.log("\n4. Configuring oracle...");
  const authTx = await oracle.authorizeFulfiller(deployer.address);
  await authTx.wait();
  console.log("✓ Deployer authorized as oracle fulfiller");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("QuantumRandomnessOracle:", oracleAddress);
  console.log("ArbitrationToken:", tokenAddress);
  console.log("Arbitration:", arbitrationAddress);
  console.log("=".repeat(60));

  console.log("\nNext steps:");
  console.log("1. Set environment variables:");
  console.log(`   export ORACLE_CONTRACT_ADDRESS=${oracleAddress}`);
  console.log(`   export ANU_API_KEY=your_api_key_here`);
  console.log("\n2. Run oracle service:");
  console.log("   node scripts/quantum-oracle-service.js");
  console.log("\n3. Deploy marketplace and set arbitration address");

  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      quantumRandomnessOracle: oracleAddress,
      arbitrationToken: tokenAddress,
      arbitration: arbitrationAddress
    },
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n✓ Addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
