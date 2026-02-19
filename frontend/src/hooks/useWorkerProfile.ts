import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getWorkerRegistryContract } from '@/lib/contracts';
import { parseEther } from 'viem';

export function useWorkerProfile() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const saveProfile = useCallback(async (
        name: string,
        bio: string,
        skills: string,
        hourlyRateEth: string
    ) => {
        if (!walletClient || !publicClient) throw new Error('Wallet not connected');
        try {
            setLoading(true);
            setError(null);
            const contract: any = getWorkerRegistryContract(walletClient);
            const rateWei = parseEther(hourlyRateEth || '0');
            const tx = await contract.write.registerWorker([name, bio, skills, rateWei]);
            await publicClient.waitForTransactionReceipt({ hash: tx });
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [walletClient, publicClient]);

    return { saveProfile, loading, error };
}
