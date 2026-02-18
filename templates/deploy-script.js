// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Get the contract factory
  const MyContract = await hre.ethers.getContractFactory("MyContract");

  // Deploy the contract
  console.log("Deploying MyContract...");
  const myContract = await MyContract.deploy(/* constructor args */);

  // Wait for deployment to complete
  await myContract.waitForDeployment();

  const address = await myContract.getAddress();
  console.log("MyContract deployed to:", address);

  // Verify contract on Etherscan (if not on local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await myContract.deploymentTransaction().wait(6); // Wait 6 blocks

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [/* constructor args */]
      });
      console.log("Contract verified successfully");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Error verifying contract:", error);
      }
    }
  }

  return address;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
