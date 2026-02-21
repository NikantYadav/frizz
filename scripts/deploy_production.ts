import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Starting production deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy QuantumRandomnessOracle
    const QuantumRandomnessOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
    const quantumRandomnessOracle = await QuantumRandomnessOracle.deploy();
    await quantumRandomnessOracle.waitForDeployment();
    const quantumRandomnessOracleAddress = await quantumRandomnessOracle.getAddress();
    console.log("QuantumRandomnessOracle deployed to:", quantumRandomnessOracleAddress);

    // 2. Deploy Arbitration
    const Arbitration = await ethers.getContractFactory("Arbitration");
    const arbitration = await Arbitration.deploy(quantumRandomnessOracleAddress);
    await arbitration.waitForDeployment();
    const arbitrationAddress = await arbitration.getAddress();
    console.log("Arbitration deployed to:", arbitrationAddress);

    // 3. Deploy ReputationSystem
    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    const reputationSystem = await ReputationSystem.deploy();
    await reputationSystem.waitForDeployment();
    const reputationSystemAddress = await reputationSystem.getAddress();
    console.log("ReputationSystem deployed to:", reputationSystemAddress);

    // 4. Deploy WorkerRegistry
    const WorkerRegistry = await ethers.getContractFactory("WorkerRegistry");
    const workerRegistry = await WorkerRegistry.deploy(deployer.address, deployer.address);
    await workerRegistry.waitForDeployment();
    const workerRegistryAddress = await workerRegistry.getAddress();
    console.log("WorkerRegistry deployed to:", workerRegistryAddress);

    // 5. Deploy JobMarketplace
    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    const jobMarketplace = await JobMarketplace.deploy(
        arbitrationAddress,
        reputationSystemAddress,
        workerRegistryAddress
    );
    await jobMarketplace.waitForDeployment();
    const jobMarketplaceAddress = await jobMarketplace.getAddress();
    console.log("JobMarketplace deployed to:", jobMarketplaceAddress);

    // 6. Wire up permissions
    console.log("Wiring up permissions...");

    // Authorize Marketplace to update Reputation
    const tx1 = await reputationSystem.setAuthorizedCaller(jobMarketplaceAddress, true);
    await tx1.wait();
    console.log("ReputationSystem: Authorized JobMarketplace");

    // Set Marketplace in Arbitration
    const tx2 = await arbitration.setMarketplace(jobMarketplaceAddress);
    await tx2.wait();
    console.log("Arbitration: Set JobMarketplace");

    // 7. Output to Frontend
    const addresses = {
        QuantumRandomnessOracle: quantumRandomnessOracleAddress,
        Arbitration: arbitrationAddress,
        ReputationSystem: reputationSystemAddress,
        WorkerRegistry: workerRegistryAddress,
        JobMarketplace: jobMarketplaceAddress,
    };

    const frontendLibDir = path.join(__dirname, "../frontend/src/lib");
    const frontendAbisDir = path.join(frontendLibDir, "abis");

    if (!fs.existsSync(frontendLibDir)) {
        fs.mkdirSync(frontendLibDir, { recursive: true });
    }
    if (!fs.existsSync(frontendAbisDir)) {
        fs.mkdirSync(frontendAbisDir, { recursive: true });
    }

    // Write Addresses
    fs.writeFileSync(
        path.join(frontendLibDir, "contract-addresses.json"),
        JSON.stringify(addresses, null, 2)
    );
    console.log("Addresses written to contract-addresses.json");

    // Copy ABIs
    const artifactsDir = path.join(__dirname, "../artifacts/contracts");

    const contractsToCopy = [
        { name: "Arbitration", path: "Arbitration.sol/Arbitration.json" },
        { name: "ReputationSystem", path: "ReputationSystem.sol/ReputationSystem.json" },
        { name: "WorkerRegistry", path: "WorkerRegistry.sol/WorkerRegistry.json" },
        { name: "JobMarketplace", path: "JobMarketplace.sol/JobMarketplace.json" },
        { name: "JobEscrow", path: "JobEscrow.sol/JobEscrow.json" }
    ];

    contractsToCopy.forEach(contract => {
        const src = path.join(artifactsDir, contract.path);
        const dest = path.join(frontendAbisDir, `${contract.name}.json`);
        if (fs.existsSync(src)) {
            const content = JSON.parse(fs.readFileSync(src, "utf8"));
            fs.writeFileSync(dest, JSON.stringify(content, null, 2));
            console.log(`Copied ${contract.name} ABI`);
        } else {
            console.warn(`Artifact not found for ${contract.name} at ${src}`);
        }
    });

    // Write to .env.local
    const envPath = path.join(__dirname, "../frontend/.env.local");
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf8");
        envContent = envContent.replace(/NEXT_PUBLIC_JOB_MARKETPLACE_ADDRESS=.*/, `NEXT_PUBLIC_JOB_MARKETPLACE_ADDRESS=${jobMarketplaceAddress}`);
        envContent = envContent.replace(/NEXT_PUBLIC_ARBITRATION_ADDRESS=.*/, `NEXT_PUBLIC_ARBITRATION_ADDRESS=${arbitrationAddress}`);
        envContent = envContent.replace(/NEXT_PUBLIC_REPUTATION_ADDRESS=.*/, `NEXT_PUBLIC_REPUTATION_ADDRESS=${reputationSystemAddress}`);
        envContent = envContent.replace(/NEXT_PUBLIC_WORKER_REGISTRY_ADDRESS=.*/, `NEXT_PUBLIC_WORKER_REGISTRY_ADDRESS=${workerRegistryAddress}`);

        fs.writeFileSync(envPath, envContent);
        console.log("Updated .env.local with new contract addresses");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
