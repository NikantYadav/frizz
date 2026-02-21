import { expect } from "chai";
import { network } from "hardhat";

describe("JobMarketplace System", function () {
  let jobMarketplace: any;
  let arbitration: any;
  let arbitrationToken: any;
  let reputationSystem: any;
  let workerRegistry: any;
  let negotiation: any;
  let deployer: any;
  let client: any;
  let worker: any;
  let juror1: any;
  let juror2: any;
  let juror3: any;
  let ethers: any;
  let STAKE_AMOUNT: any;
  let JOB_BUDGET: any;
  let ARBITRATION_FEE: any;
  let CATEGORY_ID: number;

  beforeEach(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;
    
    STAKE_AMOUNT = ethers.parseEther("100");
    JOB_BUDGET = ethers.parseEther("5");
    ARBITRATION_FEE = ethers.parseEther("10"); // 10 tokens as per Arbitration.sol
    CATEGORY_ID = 1; // Development category
    
    [deployer, client, worker, juror1, juror2, juror3] = await ethers.getSigners();

    // Deploy ArbitrationToken
    const ArbitrationToken = await ethers.getContractFactory("ArbitrationToken");
    arbitrationToken = await ArbitrationToken.deploy(ethers.parseEther("1000000"));
    await arbitrationToken.waitForDeployment();

    // Deploy mock oracle (you'll need to create this or use a real one)
    const MockOracle = await ethers.getContractFactory("QuantumRandomnessOracle");
    const mockOracle = await MockOracle.deploy();
    await mockOracle.waitForDeployment();

    // Deploy Arbitration
    const Arbitration = await ethers.getContractFactory("Arbitration");
    arbitration = await Arbitration.deploy(
      await arbitrationToken.getAddress(),
      await mockOracle.getAddress()
    );
    await arbitration.waitForDeployment();

    // Deploy ReputationSystem
    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputationSystem = await ReputationSystem.deploy();
    await reputationSystem.waitForDeployment();

    // Deploy WorkerRegistry
    const WorkerRegistry = await ethers.getContractFactory("WorkerRegistry");
    workerRegistry = await WorkerRegistry.deploy();
    await workerRegistry.waitForDeployment();

    // Deploy Negotiation
    const Negotiation = await ethers.getContractFactory("Negotiation");
    negotiation = await Negotiation.deploy();
    await negotiation.waitForDeployment();

    // Deploy JobMarketplace
    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    jobMarketplace = await JobMarketplace.deploy(
      await arbitration.getAddress(),
      await arbitrationToken.getAddress(),
      await reputationSystem.getAddress(),
      await workerRegistry.getAddress(),
      await negotiation.getAddress()
    );
    await jobMarketplace.waitForDeployment();
    
    // Set marketplace address in arbitration contract
    await arbitration.setMarketplace(await jobMarketplace.getAddress());

    // Add category to arbitration
    await arbitration.addCategory("Development");

    // Setup jurors with tokens
    await arbitrationToken.transfer(juror1.address, STAKE_AMOUNT * 2n);
    await arbitrationToken.transfer(juror2.address, STAKE_AMOUNT * 2n);
    await arbitrationToken.transfer(juror3.address, STAKE_AMOUNT * 2n);

    // Setup client and worker with arbitration tokens for disputes
    await arbitrationToken.transfer(client.address, ARBITRATION_FEE * 10n);
    await arbitrationToken.transfer(worker.address, ARBITRATION_FEE * 10n);
  });

  describe("Job Posting and Applications", function () {
    it("Should allow client to post a job", async function () {
      const tx = await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );

      await expect(tx)
        .to.emit(jobMarketplace, "JobPosted")
        .withArgs(1, client.address, "Test Job", CATEGORY_ID, JOB_BUDGET);

      const job = await jobMarketplace.getJob(1);
      expect(job.title).to.equal("Test Job");
      expect(job.client).to.equal(client.address);
      expect(job.budget).to.equal(JOB_BUDGET);
    });

    it("Should allow worker to apply to job", async function () {
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );

      const tx = await jobMarketplace.connect(worker).applyToJob(
        1,
        "QmCoverLetterHash",
        "QmWorkHistoryHash"
      );

      await expect(tx)
        .to.emit(jobMarketplace, "ApplicationSubmitted")
        .withArgs(1, worker.address);

      const applications = await jobMarketplace.getApplications(1);
      expect(applications.length).to.equal(1);
      expect(applications[0].worker).to.equal(worker.address);
    });

    it("Should not allow application to inactive job", async function () {
      await expect(
        jobMarketplace.connect(worker).applyToJob(999, "Hash1", "Hash2")
      ).to.be.revertedWith("Job not active");
    });
  });

  describe("Escrow and Worker Selection", function () {
    beforeEach(async function () {
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );
      await jobMarketplace.connect(worker).applyToJob(1, "Hash1", "Hash2");
    });

    it("Should create and fund escrow", async function () {
      const tx = await jobMarketplace.connect(client).createAndFundEscrow(1, {
        value: JOB_BUDGET
      });

      await expect(tx).to.emit(jobMarketplace, "EscrowCreated");

      const job = await jobMarketplace.getJob(1);
      expect(job.escrowContract).to.not.equal(ethers.ZeroAddress);
    });

    it("Should not allow funding with wrong amount", async function () {
      await expect(
        jobMarketplace.connect(client).createAndFundEscrow(1, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Must match budget");
    });

    it("Should select worker after escrow funded", async function () {
      await jobMarketplace.connect(client).createAndFundEscrow(1, {
        value: JOB_BUDGET
      });

      const tx = await jobMarketplace.connect(client).selectWorker(1, worker.address);

      await expect(tx)
        .to.emit(jobMarketplace, "WorkerSelected")
        .withArgs(1, worker.address);

      const job = await jobMarketplace.getJob(1);
      expect(job.selectedWorker).to.equal(worker.address);
    });

    it("Should not allow selecting worker before escrow", async function () {
      await expect(
        jobMarketplace.connect(client).selectWorker(1, worker.address)
      ).to.be.revertedWith("Escrow not created");
    });
  });

  describe("Work Submission and Payment", function () {
    beforeEach(async function () {
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );
      await jobMarketplace.connect(worker).applyToJob(1, "Hash1", "Hash2");
      await jobMarketplace.connect(client).createAndFundEscrow(1, {
        value: JOB_BUDGET
      });
      await jobMarketplace.connect(client).selectWorker(1, worker.address);
    });

    it("Should allow worker to submit work", async function () {
      const tx = await jobMarketplace.connect(worker).submitWork(1, "QmWorkHash");

      await expect(tx)
        .to.emit(jobMarketplace, "WorkSubmitted")
        .withArgs(1, "QmWorkHash");

      const job = await jobMarketplace.getJob(1);
      expect(job.workSubmitted).to.be.true;
    });

    it("Should allow client to accept work and release payment", async function () {
      await jobMarketplace.connect(worker).submitWork(1, "QmWorkHash");

      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);
      
      await jobMarketplace.connect(client).acceptWorkAndPay(1);

      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(JOB_BUDGET);

      const job = await jobMarketplace.getJob(1);
      expect(job.isCompleted).to.be.true;
    });

    it("Should not allow payment before work submission", async function () {
      await expect(
        jobMarketplace.connect(client).acceptWorkAndPay(1)
      ).to.be.revertedWith("Work not submitted");
    });
  });

  describe("Milestone System", function () {
    beforeEach(async function () {
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );
      await jobMarketplace.connect(worker).applyToJob(1, "Hash1", "Hash2");
      await jobMarketplace.connect(client).createAndFundEscrow(1, {
        value: JOB_BUDGET
      });
    });

    it("Should allow adding milestones", async function () {
      await jobMarketplace.connect(client).addMilestone(
        1,
        "First milestone",
        ethers.parseEther("2")
      );

      const job = await jobMarketplace.getJob(1);
      const escrow = await ethers.getContractAt("JobEscrow", job.escrowContract);
      const count = await escrow.getMilestoneCount();
      expect(count).to.equal(1);
    });

    it("Should release milestone payment", async function () {
      await jobMarketplace.connect(client).selectWorker(1, worker.address);
      await jobMarketplace.connect(client).addMilestone(
        1,
        "First milestone",
        ethers.parseEther("2")
      );

      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);
      
      await jobMarketplace.connect(client).releaseMilestonePayment(1, 0);

      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(ethers.parseEther("2"));
    });
  });

  describe("Arbitration System", function () {
    beforeEach(async function () {
      // Setup jurors
      await arbitrationToken.connect(juror1).approve(await arbitration.getAddress(), STAKE_AMOUNT);
      await arbitration.connect(juror1).stakeAsJuror([CATEGORY_ID]);

      await arbitrationToken.connect(juror2).approve(await arbitration.getAddress(), STAKE_AMOUNT);
      await arbitration.connect(juror2).stakeAsJuror([CATEGORY_ID]);

      await arbitrationToken.connect(juror3).approve(await arbitration.getAddress(), STAKE_AMOUNT);
      await arbitration.connect(juror3).stakeAsJuror([CATEGORY_ID]);

      // Create job
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );
      await jobMarketplace.connect(worker).applyToJob(1, "Hash1", "Hash2");
      await jobMarketplace.connect(client).createAndFundEscrow(1, {
        value: JOB_BUDGET
      });
      await jobMarketplace.connect(client).selectWorker(1, worker.address);
      await jobMarketplace.connect(worker).submitWork(1, "QmWorkHash");
    });

    it("Should allow raising a dispute", async function () {
      // Approve arbitration token transfer
      await arbitrationToken.connect(client).approve(
        await jobMarketplace.getAddress(),
        ARBITRATION_FEE
      );

      const tx = await jobMarketplace.connect(client).raiseDispute(1);

      await expect(tx).to.emit(jobMarketplace, "DisputeRaised");

      const job = await jobMarketplace.getJob(1);
      expect(job.isDisputed).to.be.true;
      expect(job.disputeId).to.be.greaterThan(0);
    });

    it("Should select jurors for dispute", async function () {
      await arbitrationToken.connect(client).approve(
        await jobMarketplace.getAddress(),
        ARBITRATION_FEE
      );
      await jobMarketplace.connect(client).raiseDispute(1);

      const job = await jobMarketplace.getJob(1);
      
      // Complete juror selection
      await arbitration.completeJurorSelection(job.disputeId);
      
      const selectedJurors = await arbitration.getSelectedJurors(job.disputeId);
      
      expect(selectedJurors.length).to.equal(3);
    });

    it("Should allow jurors to vote", async function () {
      await arbitrationToken.connect(client).approve(
        await jobMarketplace.getAddress(),
        ARBITRATION_FEE
      );
      await jobMarketplace.connect(client).raiseDispute(1);

      const job = await jobMarketplace.getJob(1);
      
      // Complete juror selection
      await arbitration.completeJurorSelection(job.disputeId);
      
      // Commit votes
      const salt1 = "salt1";
      const salt2 = "salt2";
      const salt3 = "salt3";
      
      const commitHash1 = ethers.keccak256(
        ethers.solidityPacked(["bool", "string", "address"], [false, salt1, juror1.address])
      );
      const commitHash2 = ethers.keccak256(
        ethers.solidityPacked(["bool", "string", "address"], [false, salt2, juror2.address])
      );
      const commitHash3 = ethers.keccak256(
        ethers.solidityPacked(["bool", "string", "address"], [true, salt3, juror3.address])
      );
      
      await arbitration.connect(juror1).commitVote(job.disputeId, commitHash1);
      await arbitration.connect(juror2).commitVote(job.disputeId, commitHash2);
      const tx = await arbitration.connect(juror3).commitVote(job.disputeId, commitHash3);
      await expect(tx).to.emit(arbitration, "VoteCommitted");
    });

    it("Should resolve dispute and pay winner", async function () {
      await arbitrationToken.connect(client).approve(
        await jobMarketplace.getAddress(),
        ARBITRATION_FEE
      );
      await jobMarketplace.connect(client).raiseDispute(1);

      const job = await jobMarketplace.getJob(1);
      
      // Complete juror selection
      await arbitration.completeJurorSelection(job.disputeId);
      
      // Commit votes: 2 for worker, 1 for client
      const salt1 = "salt1";
      const salt2 = "salt2";
      const salt3 = "salt3";
      
      const commitHash1 = ethers.keccak256(
        ethers.solidityPacked(["bool", "string", "address"], [false, salt1, juror1.address])
      );
      const commitHash2 = ethers.keccak256(
        ethers.solidityPacked(["bool", "string", "address"], [false, salt2, juror2.address])
      );
      const commitHash3 = ethers.keccak256(
        ethers.solidityPacked(["bool", "string", "address"], [true, salt3, juror3.address])
      );
      
      await arbitration.connect(juror1).commitVote(job.disputeId, commitHash1);
      await arbitration.connect(juror2).commitVote(job.disputeId, commitHash2);
      await arbitration.connect(juror3).commitVote(job.disputeId, commitHash3);

      // Fast forward past commit period
      await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
      await network.provider.send("evm_mine");

      // Reveal votes
      await arbitration.connect(juror1).revealVote(job.disputeId, false, salt1);
      await arbitration.connect(juror2).revealVote(job.disputeId, false, salt2);
      await arbitration.connect(juror3).revealVote(job.disputeId, true, salt3);

      // Fast forward past reveal period
      await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
      await network.provider.send("evm_mine");

      // Finalize dispute
      await arbitration.finalizeDispute(job.disputeId);

      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);
      
      await jobMarketplace.connect(client).resolveDispute(1);

      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(JOB_BUDGET);
    });
  });

  describe("Security Features", function () {
    it("Should prevent reentrancy attacks", async function () {
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );
      await jobMarketplace.connect(worker).applyToJob(1, "Hash1", "Hash2");
      await jobMarketplace.connect(client).createAndFundEscrow(1, {
        value: JOB_BUDGET
      });
      await jobMarketplace.connect(client).selectWorker(1, worker.address);
      await jobMarketplace.connect(worker).submitWork(1, "QmWorkHash");

      // ReentrancyGuard should prevent double payment
      await jobMarketplace.connect(client).acceptWorkAndPay(1);
      
      await expect(
        jobMarketplace.connect(client).acceptWorkAndPay(1)
      ).to.be.revertedWith("Already completed");
    });

    it("Should enforce access control", async function () {
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        CATEGORY_ID,
        JOB_BUDGET
      );

      // Worker cannot fund escrow
      await expect(
        jobMarketplace.connect(worker).createAndFundEscrow(1, {
          value: JOB_BUDGET
        })
      ).to.be.revertedWith("Only client");
    });
  });
});
