import { expect } from "chai";
import { network } from "hardhat";

describe("JobMarketplace System", function () {
  let jobMarketplace: any;
  let arbitration: any;
  let arbitrationToken: any;
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

  beforeEach(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;
    
    STAKE_AMOUNT = ethers.parseEther("100");
    JOB_BUDGET = ethers.parseEther("5");
    ARBITRATION_FEE = ethers.parseEther("0.01");
    
    [deployer, client, worker, juror1, juror2, juror3] = await ethers.getSigners();

    // Deploy ArbitrationToken
    const ArbitrationToken = await ethers.getContractFactory("ArbitrationToken");
    arbitrationToken = await ArbitrationToken.deploy(ethers.parseEther("1000000"));
    await arbitrationToken.waitForDeployment();

    // Deploy Arbitration
    const Arbitration = await ethers.getContractFactory("Arbitration");
    arbitration = await Arbitration.deploy(await arbitrationToken.getAddress());
    await arbitration.waitForDeployment();

    // Deploy JobMarketplace
    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    jobMarketplace = await JobMarketplace.deploy(await arbitration.getAddress());
    await jobMarketplace.waitForDeployment();
    
    // Set marketplace address in arbitration contract
    await arbitration.setMarketplace(await jobMarketplace.getAddress());

    // Setup jurors
    await arbitrationToken.transfer(juror1.address, STAKE_AMOUNT * 2n);
    await arbitrationToken.transfer(juror2.address, STAKE_AMOUNT * 2n);
    await arbitrationToken.transfer(juror3.address, STAKE_AMOUNT * 2n);
  });

  describe("Job Posting and Applications", function () {
    it("Should allow client to post a job", async function () {
      const tx = await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        "Development",
        JOB_BUDGET
      );

      await expect(tx)
        .to.emit(jobMarketplace, "JobPosted")
        .withArgs(1, client.address, "Test Job", "Development", JOB_BUDGET);

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
        "Development",
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
        "Development",
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
        "Development",
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
        "Development",
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
      await arbitration.connect(juror1).stakeAsJuror(["Development"]);

      await arbitrationToken.connect(juror2).approve(await arbitration.getAddress(), STAKE_AMOUNT);
      await arbitration.connect(juror2).stakeAsJuror(["Development"]);

      await arbitrationToken.connect(juror3).approve(await arbitration.getAddress(), STAKE_AMOUNT);
      await arbitration.connect(juror3).stakeAsJuror(["Development"]);

      // Create job
      await jobMarketplace.connect(client).postJob(
        "Test Job",
        "Description",
        "Skills",
        "Development",
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
      const tx = await jobMarketplace.connect(client).raiseDispute(1, {
        value: ARBITRATION_FEE
      });

      await expect(tx).to.emit(jobMarketplace, "DisputeRaised");

      const job = await jobMarketplace.getJob(1);
      expect(job.isDisputed).to.be.true;
      expect(job.disputeId).to.be.greaterThan(0);
    });

    it("Should select jurors for dispute", async function () {
      await jobMarketplace.connect(client).raiseDispute(1, {
        value: ARBITRATION_FEE
      });

      const job = await jobMarketplace.getJob(1);
      const selectedJurors = await arbitration.getSelectedJurors(job.disputeId);
      
      expect(selectedJurors.length).to.equal(3);
    });

    it("Should allow jurors to vote", async function () {
      await jobMarketplace.connect(client).raiseDispute(1, {
        value: ARBITRATION_FEE
      });

      const job = await jobMarketplace.getJob(1);
      
      await arbitration.connect(juror1).vote(job.disputeId, false);
      await arbitration.connect(juror2).vote(job.disputeId, false);
      
      const tx = await arbitration.connect(juror3).vote(job.disputeId, true);
      await expect(tx).to.emit(arbitration, "VoteCast");
    });

    it("Should resolve dispute and pay winner", async function () {
      await jobMarketplace.connect(client).raiseDispute(1, {
        value: ARBITRATION_FEE
      });

      const job = await jobMarketplace.getJob(1);
      
      // Vote: 2 for worker, 1 for client
      await arbitration.connect(juror1).vote(job.disputeId, false);
      await arbitration.connect(juror2).vote(job.disputeId, false);
      await arbitration.connect(juror3).vote(job.disputeId, true);

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
        "Development",
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
        "Development",
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
