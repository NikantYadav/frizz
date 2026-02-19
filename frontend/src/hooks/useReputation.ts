import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { getReputationContract } from '@/lib/contracts';

export interface ReputationData {
    score: number;
    completedJobs: number;
    disputeWins: number;
    disputeLosses: number;
    totalVolume: string;
    ratingsSum: number;
    ratingCount: number;
}

export function useReputation(address?: string) {
    const [reputation, setReputation] = useState<ReputationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();

    const fetchReputation = useCallback(async () => {
        if (!publicClient || !address) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const contract: any = getReputationContract(publicClient);
            const rep: any = await contract.read.getReputation([address]);
            setReputation({
                score: Number(rep.score),
                completedJobs: Number(rep.completedJobs),
                disputeWins: Number(rep.disputeWins),
                disputeLosses: Number(rep.disputeLosses),
                totalVolume: (Number(rep.totalVolume) / 1e18).toFixed(4),
                ratingsSum: Number(rep.ratingsSum),
                ratingCount: Number(rep.ratingCount),
            });
        } catch (err: any) {
            console.error('Error fetching reputation:', err);
            setError(err.message || 'Failed to fetch reputation');
        } finally {
            setLoading(false);
        }
    }, [publicClient, address]);

    useEffect(() => {
        fetchReputation();
    }, [fetchReputation]);

    return { reputation, loading, error, refetch: fetchReputation };
}
