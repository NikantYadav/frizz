import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const ethers = connection.ethers;
  
  console.log("🚀 Job Marketplace Interaction Script\n");

  // Get signers
  const [deployer, client, worker1, worker2, juror1, juror2, juror3] = await ethers.getSigners();

  console.log("📋 Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Client:", client.address);
  console.log("Worker 1:", worker1.address);
  console.log("Worker 2:", worker2.address);
  console.log("Juror 1:", juror1.address);
  console.log("Juror 2:", juror2.address);
  console.log("Juror 3:", juror3.address);
  console.log();

  // Deploy contracts
  console.log("📦 Deploying contracts...");
  
  const ArbitrationToken = await ethers.getContractFactory("ArbitrationToken");
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const arbitrationToken = await ArbitrationToken.deploy(initialSupply);
  await arbitrationToken.waitForDeployment();
  console.log("✅ ArbitrationToken deployed:", await arbitrationToken.getAddress());

  // Deploy mock oracle
  const MockOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
  const mockOracle = await MockOracle.deploy();
  await mockOracle.waitForDeployment();
  console.log("✅ MockOracle deployed:", await mockOracle.getAddress());

  const Arbitration = await ethers.getContractFactory("Arbitration");
  const arbitration = await Arbitration.deploy(
    await arbitrationToken.getAddress(),
    await mockOracle.getAddress()
  );
  await arbitration.waitForDeployment();
  console.log("✅ Arbitration deployed:", await arbitration.getAddress());

  // Deploy other required contracts
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  console.log("✅ ReputationSystem deployed:", await reputationSystem.getAddress());

  const WorkerRegistry = await ethers.getContractFactory("WorkerRegistry");
  const workerRegistry = await WorkerRegistry.deploy();
  await workerRegistry.waitForDeployment();
  console.log("✅ WorkerRegistry deployed:", await workerRegistry.getAddress());

  const Negotiation = await ethers.getContractFactory("Negotiation");
  const negotiation = await Negotiation.deploy();
  await negotiation.waitForDeployment();
  console.log("✅ Negotiation deployed:", await negotiation.getAddress());

  const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
  const jobMarketplace = await JobMarketplace.deploy(
    await arbitration.getAddress(),
    await arbitrationToken.getAddress(),
    await reputationSystem.getAddress(),
    await workerRegistry.getAddress(),
    await negotiation.getAddress()
  );
  await jobMarketplace.waitForDeployment();
  console.log("✅ JobMarketplace deployed:", await jobMarketplace.getAddress());
  
  // Set marketplace address in arbitration contract
  await arbitration.setMarketplace(await jobMarketplace.getAddress());
  console.log("✅ Marketplace address set in Arbitration contract");

  // Add categories
  await arbitration.addCategory("Development");
  await arbitration.addCategory("Design");
  await arbitration.addCategory("Marketing");
  await arbitration.addCategory("Writing");
  console.log("✅ Categories added");
  console.log();

  // Distribute tokens to jurors and client
  console.log("💰 Distributing tokens...");
  const stakeAmount = ethers.parseEther("100");
  const arbitrationFee = ethers.parseEther("10");
  
  await arbitrationToken.transfer(juror1.address, stakeAmount * 2n);
  await arbitrationToken.transfer(juror2.address, stakeAmount * 2n);
  await arbitrationToken.transfer(juror3.address, stakeAmount * 2n);
  await arbitrationToken.transfer(client.address, arbitrationFee * 10n);
  console.log("✅ Tokens distributed\n");

  // Jurors stake tokens
  console.log("🔒 Jurors staking tokens...");
  
  const tokenAsJuror1 = arbitrationToken.connect(juror1);
  await tokenAsJuror1.approve(await arbitration.getAddress(), stakeAmount);
  const arbitrationAsJuror1 = arbitration.connect(juror1);
  await arbitrationAsJuror1.stakeAsJuror([1, 2]); // Development, Design
  console.log("✅ Juror 1 staked");

  const tokenAsJuror2 = arbitrationToken.connect(juror2);
  await tokenAsJuror2.approve(await arbitration.getAddress(), stakeAmount);
  const arbitrationAsJuror2 = arbitration.connect(juror2);
  await arbitrationAsJuror2.stakeAsJuror([1, 3]); // Development, Marketing
  console.log("✅ Juror 2 staked");

  const tokenAsJuror3 = arbitrationToken.connect(juror3);
  await tokenAsJuror3.approve(await arbitration.getAddress(), stakeAmount);
  const arbitrationAsJuror3 = arbitration.connect(juror3);
  await arbitrationAsJuror3.stakeAsJuror([1, 4]); // Development, Writing
  console.log("✅ Juror 3 staked\n");

  // Client posts a job
  console.log("📝 Client posting a job...");
  const marketplaceAsClient = jobMarketplace.connect(client);
  
  const tx = await marketplaceAsClient.postJob(
    "Build a DeFi Dashboard",
    "Need a React dashboard for DeFi analytics",
    "React, TypeScript, Web3.js",
    1, // Development category ID
    ethers.parseEther("5")
  );
  const receipt = await tx.wait();
  
  // Get job ID from event
  const jobPostedEvent = receipt?.logs.find(
    (log: any) => {
      try {
        return jobMarketplace.interface.parseLog(log)?.name === "JobPosted";
      } catch {
        return false;
      }
    }
  );
  const parsedEvent = jobMarketplace.interface.parseLog(jobPostedEvent as any);
  const jobId = parsedEvent?.args[0];
  
  console.log("✅ Job posted with ID:", jobId.toString());
  console.log();

  // Workers apply to the job
  console.log("📨 Workers applying to job...");
  const marketplaceAsWorker1 = jobMarketplace.connect(worker1);
  await marketplaceAsWorker1.applyToJob(
    jobId,
    "QmCoverLetter1Hash", // IPFS hash placeholder
    "QmWorkHistory1Hash"
  );
  console.log("✅ Worker 1 applied");

  const marketplaceAsWorker2 = jobMarketplace.connect(worker2);
  await marketplaceAsWorker2.applyToJob(
    jobId,
    "QmCoverLetter2Hash",
    "QmWorkHistory2Hash"
  );
  console.log("✅ Worker 2 applied\n");

  // Client creates and funds escrow
  console.log("💵 Client creating and funding escrow...");
  await marketplaceAsClient.createAndFundEscrow(jobId, {
    value: ethers.parseEther("5")
  });
  console.log("✅ Escrow created and funded\n");

  // Client selects worker
  console.log("👷 Client selecting worker...");
  await marketplaceAsClient.selectWorker(jobId, worker1.address);
  console.log("✅ Worker 1 selected\n");

  // Worker submits work
  console.log("📤 Worker submitting work...");
  await marketplaceAsWorker1.submitWork(jobId, "QmWorkSubmissionHash");
  console.log("✅ Work submitted\n");

  // Scenario 1: Client accepts work
  console.log("✅ Scenario 1: Client accepts work and releases payment...");
  const workerBalanceBefore = await ethers.provider.getBalance(worker1.address);
  await marketplaceAsClient.acceptWorkAndPay(jobId);
  const workerBalanceAfter = await ethers.provider.getBalance(worker1.address);
  console.log("💰 Worker received:", ethers.formatEther(workerBalanceAfter - workerBalanceBefore), "ETH");
  console.log();

  // Scenario 2: Dispute flow (create a new job for this)
  console.log("⚖️ Scenario 2: Dispute Resolution Flow");
  console.log("📝 Creating new job for dispute scenario...");
  
  const tx2 = await marketplaceAsClient.postJob(
    "Design Landing Page",
    "Need a modern landing page design",
    "Figma, UI/UX",
    2, // Design category ID
    ethers.parseEther("3")
  );
  const receipt2 = await tx2.wait();
  const jobPostedEvent2 = receipt2?.logs.find(
    (log: any) => {
      try {
        return jobMarketplace.interface.parseLog(log)?.name === "JobPosted";
      } catch {
        return false;
      }
    }
  );
  const parsedEvent2 = jobMarketplace.interface.parseLog(jobPostedEvent2 as any);
  const jobId2 = parsedEvent2?.args[0];
  console.log("✅ Job 2 posted with ID:", jobId2.toString());

  await marketplaceAsWorker2.applyToJob(jobId2, "QmCoverLetter3Hash", "QmWorkHistory3Hash");
  console.log("✅ Worker 2 applied");

  await marketplaceAsClient.createAndFundEscrow(jobId2, {
    value: ethers.parseEther("3")
  });
  console.log("✅ Escrow funded");

  await marketplaceAsClient.selectWorker(jobId2, worker2.address);
  console.log("✅ Worker 2 selected");

  const marketplaceAsWorker2Connected = jobMarketplace.connect(worker2);
  await marketplaceAsWorker2Connected.submitWork(jobId2, "QmWorkSubmission2Hash");
  console.log("✅ Work submitted");

  // Client raises dispute
  console.log("⚠️ Client raising dispute...");
  const arbitrationFee = ethers.parseEther("10"); // 10 tokens
  const tokenAsClient = arbitrationToken.connect(client);
  await tokenAsClient.approve(await jobMarketplace.getAddress(), arbitrationFee);
  await marketplaceAsClient.raiseDispute(jobId2);
  console.log("✅ Dispute raised\n");

  // Get job details
  const job2 = await jobMarketplace.getJob(jobId2);
  console.log("📊 Dispute ID:", job2.disputeId.toString());

  // Complete juror selection
  console.log("🎲 Completing juror selection...");
  await arbitration.completeJurorSelection(job2.disputeId);
  console.log("✅ Juror selection completed");

  // Jurors vote (using commit-reveal)
  console.log("🗳️ Jurors committing votes...");
  const selectedJurors = await arbitration.getSelectedJurors(job2.disputeId);
  console.log("Selected jurors:", selectedJurors.length);

  // Simulate votes (2 for worker, 1 for client - worker wins)
  if (selectedJurors.length >= 3) {
    await arbitrationAsJuror1.vote(job2.disputeId, false); // Vote for worker
    console.log("✅ Juror 1 voted for worker");
    
    await arbitrationAsJuror2.vote(job2.disputeId, false); // Vote for worker
    console.log("✅ Juror 2 voted for worker");
    
    await arbitrationAsJuror3.vote(job2.disputeId, true); // Vote for client
    console.log("✅ Juror 3 voted for client");
  }
  console.log();

  // Resolve dispute
  console.log("⚖️ Resolving dispute...");
  const worker2BalanceBefore = await ethers.provider.getBalance(worker2.address);
  await marketplaceAsClient.resolveDispute(jobId2);
  const worker2BalanceAfter = await ethers.provider.getBalance(worker2.address);
  console.log("✅ Dispute resolved - Worker won");
  console.log("💰 Worker 2 received:", ethers.formatEther(worker2BalanceAfter - worker2BalanceBefore), "ETH");
  console.log();

  // Display final stats
  console.log("📊 Final Statistics:");
  console.log("Total jobs created:", (await jobMarketplace.jobCounter()).toString());
  console.log("Active jobs:", (await jobMarketplace.getActiveJobs()).length);
  console.log("Development category jurors:", (await arbitration.getJurorCountByCategory("Development")).toString());
  console.log();

  console.log("✅ All scenarios completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
