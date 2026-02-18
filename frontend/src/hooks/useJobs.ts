import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { getContract } from '@/lib/contracts';

export function useJobs(activeTab: string, address?: string) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const fetchJobs = useCallback(async () => {
    if (!publicClient) return;

    try {
      setLoading(true);
      setError(null);

      const contract = getContract(publicClient);

      let jobIds: bigint[] = [];

      if (activeTab === 'browse') {
        // Get all active jobs
        jobIds = await contract.read.getActiveJobs();
      } else if (activeTab === 'my-jobs' && address) {
        // Get jobs posted by user
        jobIds = await contract.read.getClientJobs([address]);
      } else if (activeTab === 'applications' && address) {
        // Get jobs user applied to
        jobIds = await contract.read.getWorkerApplications([address]);
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
