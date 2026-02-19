import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JobMarketplaceSystemModule = buildModule("JobMarketplaceSystemModule", (m) => {
  // Deploy ArbitrationToken with initial supply of 1 million tokens
  const initialSupply = m.getParameter("initialSupply", 1_000_000n * 10n ** 18n);
  const arbitrationToken = m.contract("ArbitrationToken", [initialSupply]);

  // Deploy Arbitration contract
  const arbitration = m.contract("Arbitration", [arbitrationToken]);

  // Deploy ReputationSystem
  const reputationSystem = m.contract("ReputationSystem");

  // Deploy WorkerRegistry
  const workerRegistry = m.contract("WorkerRegistry");

  // Deploy Negotiation
  const negotiation = m.contract("Negotiation");

  // Deploy JobMarketplace contract with all dependencies
  const jobMarketplace = m.contract("JobMarketplace", [
    arbitration,
    reputationSystem,
    workerRegistry,
    negotiation
  ]);

  // Set marketplace address in arbitration contract
  m.call(arbitration, "setMarketplace", [jobMarketplace]);

  // Authorize marketplace in ReputationSystem
  m.call(reputationSystem, "setAuthorizedCaller", [jobMarketplace, true]);

  return {
    arbitrationToken,
    arbitration,
    reputationSystem,
    workerRegistry,
    negotiation,
    jobMarketplace
  };
});

export default JobMarketplaceSystemModule;
