import { getContract as viemGetContract } from 'viem';
import JobMarketplaceABI from './abis/JobMarketplace.json';

// Update these addresses after deployment
export const CONTRACT_ADDRESSES = {
  JobMarketplace: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // Local hardhat
  Arbitration: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ArbitrationToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

export function getContract(client: any) {
  return viemGetContract({
    address: CONTRACT_ADDRESSES.JobMarketplace as `0x${string}`,
    abi: JobMarketplaceABI.abi,
    client,
  });
}

export { JobMarketplaceABI };
