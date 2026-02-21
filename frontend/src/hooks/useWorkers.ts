import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { getWorkerRegistryContract, getReputationContract } from '@/lib/contracts';
import bs58 from 'bs58';

export interface WorkerProfile {
    address: string;
    name: string;
    bio: string;
    skills: string[];
    hourlyRate: string;
    reputationScore: number;
    completedJobs: number;
    available: boolean;
}

// Helper to convert bytes32 from contract back to a CIDv0 string
function bytes32ToCid(bytes32Hash: string) {
    const hashHex = bytes32Hash.replace('0x', '');
    const multihash = Buffer.from('1220' + hashHex, 'hex');
    return bs58.encode(multihash);
}

export function useWorkers(skillFilter?: string) {
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();

    const fetchWorkers = useCallback(async () => {
        if (!publicClient) return;
        try {
            setLoading(true);
            setError(null);

            const registry: any = getWorkerRegistryContract(publicClient);
            const reputation: any = getReputationContract(publicClient);

            // In the new contract, filtering by skill is meant to be done off-chain
            // So we just get paginated workers, or since we don't have a reliable 
            // getAllWorkers anymore, we will just fetch the first 20.
            const workerAddresses: string[] = await registry.read.getWorkersPaginated([0n, 20n]);

            const profiles = await Promise.all(
                workerAddresses.map(async (addr: string) => {
                    // getWorkerInfo returns: [ipfsHash, hourlyRate, isActive, registeredAt]
                    const info: any = await registry.read.getWorkerInfo([addr]);
                    const ipfsHashBytes32 = info[0];
                    const hourlyRate = info[1];
                    const isActive = info[2];

                    if (!isActive) return null;

                    const rep: any = await reputation.read.getReputation([addr]);

                    let name = addr.slice(0, 8) + '...';
                    let bio = '';
                    let skills: string[] = [];

                    try {
                        const cid = bytes32ToCid(ipfsHashBytes32);
                        // Fetch JSON from Pinata Gateway
                        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud';
                        const res = await fetch(`${gatewayUrl}/ipfs/${cid}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.name) name = data.name;
                            if (data.bio) bio = data.bio;
                            if (data.skills) {
                                skills = typeof data.skills === 'string'
                                    ? data.skills.split(',').map((s: string) => s.trim())
                                    : data.skills;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to resolve IPFS for worker:', addr, e);
                    }

                    // filter by skill off-chain if requested
                    if (skillFilter && skillFilter.trim()) {
                        const hasSkill = skills.some(s => s.toLowerCase() === skillFilter.toLowerCase());
                        if (!hasSkill) return null;
                    }

                    return {
                        address: addr,
                        name,
                        bio,
                        skills,
                        hourlyRate: hourlyRate ? formatEther(hourlyRate) : '0',
                        reputationScore: Number(rep.score),
                        completedJobs: Number(rep.completedJobs),
                        available: isActive,
                    };
                })
            );

            setWorkers(profiles.filter(Boolean) as WorkerProfile[]);
        } catch (err: any) {
            console.error('Error fetching workers:', err);
            setError(err.message || 'Failed to fetch workers');
        } finally {
            setLoading(false);
        }
    }, [publicClient, skillFilter]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    return { workers, loading, error, refetch: fetchWorkers };
}
