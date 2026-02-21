import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { getContract } from '@/lib/contracts';

export function usePostJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const postJob = async (
    title: string,
    description: string,
    skills: string,
    category: string,
    budgetUSDC: string
  ) => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      // Map category to ID
      const categoryMap: { [key: string]: number } = {
        development: 0,
        design: 1,
        marketing: 2,
        writing: 3,
        other: 4
      };

      const categoryId = categoryMap[category] || 0;

      // Convert USDC amount to proper format (6 decimals)
      const budgetInWei = parseUnits(budgetUSDC, 6);

      // Get contract instance
      const contract: any = getContract(walletClient);

      // Call postJob function
      const hash = await contract.write.postJob([
        title,
        description,
        skills,
        BigInt(categoryId),
        budgetInWei
      ]);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction failed');
      }

      // Extract job ID from logs
      let jobId: bigint | null = null;
      if (receipt.logs && receipt.logs.length > 0) {
        // The JobPosted event should contain the job ID
        // Assuming it's the first topic after the event signature
        const log = receipt.logs[0];
        if (log.topics && log.topics.length > 1) {
          jobId = BigInt(log.topics[1]);
        }
      }

      setLoading(false);
      return { success: true, jobId, hash };
    } catch (err: any) {
      console.error('Error posting job:', err);
      const errorMessage = err.message || 'Failed to post job';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  return { postJob, loading, error };
}
