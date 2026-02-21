import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'wagmi/chains';
import { getContract } from '@/lib/contracts';

export function useJobs(activeTab: string, address?: string) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wagmiPublicClient = usePublicClient();

  // Create a fallback public client for when wallet isn't connected
  const publicClient = wagmiPublicClient || createPublicClient({
    chain: hardhat,
    transport: http('http://127.0.0.1:8545'),
  });

  const fetchJobs = useCallback(async () => {
    if (!publicClient) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contract: any = getContract(publicClient);

      let jobIds: bigint[] = [];

      if (activeTab === 'browse') {
        // Get all active jobs
        try {
          jobIds = await contract.read.getActiveJobs();
        } catch (err: any) {
          // Handle empty array case - viem sometimes throws on empty returns
          if (err.message?.includes('returned no data') || err.message?.includes('0x')) {
            jobIds = [];
          } else {
            throw err;
          }
        }
      } else if (activeTab === 'my-jobs' && address) {
        // Get jobs posted by user
        try {
          jobIds = await contract.read.getClientJobs([address]);
        } catch (err: any) {
          if (err.message?.includes('returned no data') || err.message?.includes('0x')) {
            jobIds = [];
          } else {
            throw err;
          }
        }
      } else if (activeTab === 'applications' && address) {
        // Get jobs user applied to
        try {
          jobIds = await contract.read.getWorkerApplications([address]);
        } catch (err: any) {
          if (err.message?.includes('returned no data') || err.message?.includes('0x')) {
            jobIds = [];
          } else {
            throw err;
          }
        }
      }

      // Handle empty job list
      if (!jobIds || jobIds.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // Fetch job details
      const jobPromises = jobIds.map((id) => contract.read.getJob([id]));
      const jobsData = await Promise.all(jobPromises);

      const formattedJobs = jobsData.map((job, index) => ({
        jobId: jobIds[index].toString(),
        title: job.title,
        description: job.description,
        skills: job.skills,
        category: job.category,
        budget: job.budget,
        client: job.client,
        isActive: job.isActive,
        isCompleted: job.isCompleted,
        selectedWorker: job.selectedWorker,
        escrowContract: job.escrowContract,
        workSubmitted: job.workSubmitted,
        workSubmissionHash: job.workSubmissionHash,
      }));

      setJobs(formattedJobs);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [publicClient, activeTab, address]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}
