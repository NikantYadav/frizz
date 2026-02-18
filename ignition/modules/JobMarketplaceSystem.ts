import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JobMarketplaceSystemModule = buildModule("JobMarketplaceSystemModule", (m) => {
  // Deploy ArbitrationToken with initial supply of 1 million tokens
  const initialSupply = m.getParameter("initialSupply", 1_000_000n * 10n ** 18n);
  const arbitrationToken = m.contract("ArbitrationToken", [initialSupply]);

  // Deploy Arbitration contract
  const arbitration = m.contract("Arbitration", [arbitrationToken]);

  // Deploy JobMarketplace contract
  const jobMarketplace = m.contract("JobMarketplace", [arbitration]);
  
  // Set marketplace address in arbitration contract
  m.call(arbitration, "setMarketplace", [jobMarketplace]);

  return { arbitrationToken, arbitration, jobMarketplace };
});

export default JobMarketplaceSystemModule;
