import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { getWorkerRegistryContract, getReputationContract } from '@/lib/contracts';

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

            // Get all registered workers (or by skill)
            let workerAddresses: string[] = [];
            if (skillFilter && skillFilter.trim()) {
                workerAddresses = await registry.read.getWorkersBySkill([skillFilter]);
            } else {
                workerAddresses = await registry.read.getAllWorkers();
            }

            const profiles = await Promise.all(
                workerAddresses.map(async (addr: string) => {
                    const profile: any = await registry.read.getWorker([addr]);
                    const rep: any = await reputation.read.getReputation([addr]);
                    return {
                        address: addr,
                        name: profile.name || addr.slice(0, 8) + '...',
                        bio: profile.bio || '',
                        skills: profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : [],
                        hourlyRate: profile.hourlyRate ? formatEther(profile.hourlyRate) : '0',
                        reputationScore: Number(rep.score),
                        completedJobs: Number(rep.completedJobs),
                        available: profile.isAvailable,
                    };
                })
            );

            setWorkers(profiles);
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
