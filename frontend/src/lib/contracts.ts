import { getContract as viemGetContract, type PublicClient, type WalletClient } from 'viem';
import addresses from './contract-addresses.json';
import JobMarketplaceABI from './abis/JobMarketplace.json';
import ArbitrationABI from './abis/Arbitration.json';
import ReputationSystemABI from './abis/ReputationSystem.json';
import WorkerRegistryABI from './abis/WorkerRegistry.json';
import NegotiationABI from './abis/Negotiation.json';
import JobEscrowABI from './abis/JobEscrow.json';

export const CONTRACT_ADDRESSES = addresses as {
  ArbitrationToken: `0x${string}`;
  Arbitration: `0x${string}`;
  ReputationSystem: `0x${string}`;
  WorkerRegistry: `0x${string}`;
  Negotiation: `0x${string}`;
  JobMarketplace: `0x${string}`;
};

// --- Typed factory helpers ---

export function getContract(client: PublicClient | WalletClient) {
  return viemGetContract({
    address: CONTRACT_ADDRESSES.JobMarketplace,
    abi: JobMarketplaceABI.abi,
    client,
  });
}

export function getArbitrationContract(client: PublicClient | WalletClient) {
  return viemGetContract({
    address: CONTRACT_ADDRESSES.Arbitration,
    abi: ArbitrationABI.abi,
    client,
  });
}

export function getReputationContract(client: PublicClient | WalletClient) {
  return viemGetContract({
    address: CONTRACT_ADDRESSES.ReputationSystem,
    abi: ReputationSystemABI.abi,
    client,
  });
}

export function getWorkerRegistryContract(client: PublicClient | WalletClient) {
  return viemGetContract({
    address: CONTRACT_ADDRESSES.WorkerRegistry,
    abi: WorkerRegistryABI.abi,
    client,
  });
}

export function getNegotiationContract(client: PublicClient | WalletClient) {
  return viemGetContract({
    address: CONTRACT_ADDRESSES.Negotiation,
    abi: NegotiationABI.abi,
    client,
  });
}

export function getEscrowContract(client: PublicClient | WalletClient, escrowAddress: `0x${string}`) {
  return viemGetContract({
    address: escrowAddress,
    abi: JobEscrowABI.abi,
    client,
  });
}

// Re-export ABIs for convenience
export { JobMarketplaceABI, ArbitrationABI, ReputationSystemABI, WorkerRegistryABI, NegotiationABI, JobEscrowABI };
