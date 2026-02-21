import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JobMarketplaceSystemModule = buildModule("JobMarketplaceSystemModule", (m) => {
  // Deploy QuantumRandomnessOracle
  const quantumRandomnessOracle = m.contract("QuantumRandomnessOracle");

  // Deploy Arbitration contract
  const arbitration = m.contract("Arbitration", [quantumRandomnessOracle]);

  // Deploy ReputationSystem
  const reputationSystem = m.contract("ReputationSystem");

  // Deploy WorkerRegistry
  // Requires a specific Signer address and an Admin address. For local dev we use account 0.
  const signer = m.getAccount(0);
  const admin = m.getAccount(0);
  const workerRegistry = m.contract("WorkerRegistry", [signer, admin]);

  // Deploy JobMarketplace contract with all dependencies
  const jobMarketplace = m.contract("JobMarketplace", [
    arbitration,
    reputationSystem,
    workerRegistry
  ]);

  // Set marketplace address in arbitration contract
  m.call(arbitration, "setMarketplace", [jobMarketplace]);

  // Authorize marketplace in ReputationSystem
  m.call(reputationSystem, "setAuthorizedCaller", [jobMarketplace, true]);

  return {
    quantumRandomnessOracle,
    arbitration,
    reputationSystem,
    workerRegistry,
    jobMarketplace
  };
});

export default JobMarketplaceSystemModule;
