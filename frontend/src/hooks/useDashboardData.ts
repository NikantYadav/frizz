import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { createPublicClient, http, formatUnits } from 'viem';
import { hardhat } from 'wagmi/chains';
import { getContract, getEscrowContract, getReputationContract } from '@/lib/contracts';

export interface Job {
  id: string;
  title: string;
  description: string;
  client: string;
  worker: string;
  budget: string;
  paid: string;
  status: 'active' | 'completed' | 'disputed' | 'pending';
  progress: number;
  deadline?: string;
  completedDate?: string;
  milestones: {
    completed: number;
    total: number;
  };
  escrowAddress?: string;
  disputeReason?: string;
}

export interface DashboardStats {
  activeJobs: number;
  totalSpent: string;
  completedJobs: number;
  avgRating: number;
  totalEarned?: string;
  pendingPayment?: string;
}

export function useDashboardData(mode: 'client' | 'worker') {
  const { address } = useAccount();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalSpent: '0',
    completedJobs: 0,
    avgRating: 0,
    totalEarned: '0',
    pendingPayment: '0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wagmiPublicClient = usePublicClient();

  const publicClient = wagmiPublicClient || createPublicClient({
    chain: hardhat,
    transport: http('http://127.0.0.1:8545'),
  });

  const fetchDashboardData = useCallback(async () => {
    if (!publicClient || !address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contract: any = getContract(publicClient);
      const reputationContract: any = getReputationContract(publicClient);

      let jobIds: bigint[] = [];
      
      // Fetch jobs based on mode
      if (mode === 'client') {
        try {
          jobIds = await contract.read.getClientJobs([address]);
        } catch (err: any) {
          if (!err.message?.includes('returned no data')) {
            throw err;
          }
        }
      } else {
        try {
          jobIds = await contract.read.getWorkerJobs([address]);
        } catch (err: any) {
          if (!err.message?.includes('returned no data')) {
            throw err;
          }
        }
      }

      if (!jobIds || jobIds.length === 0) {
        setJobs([]);
        setStats({
          activeJobs: 0,
          totalSpent: '0',
          completedJobs: 0,
          avgRating: 0,
          totalEarned: '0',
          pendingPayment: '0'
        });
        setLoading(false);
        return;
      }

      // Fetch job details
      const jobPromises = jobIds.map((id) => contract.read.getJob([id]));
      const jobsData = await Promise.all(jobPromises);

      // Process jobs
      const processedJobs: Job[] = [];
      let activeCount = 0;
      let completedCount = 0;
      let totalSpent = BigInt(0);
      let totalEarned = BigInt(0);
      let pendingPayment = BigInt(0);

      for (let i = 0; i < jobsData.length; i++) {
        const job = jobsData[i];
        const jobId = jobIds[i].toString();
        
        // Determine status
        let status: Job['status'] = 'pending';
        let progress = 0;
        let paid = '0';
        let milestonesCompleted = 0;
        let milestonesTotal = 1;

        if (job.escrowContract && job.escrowContract !== '0x0000000000000000000000000000000000000000') {
          try {
            const escrowContract: any = getEscrowContract(publicClient, job.escrowContract);
            const escrowState = await escrowContract.read.state();
            const releasedAmount = await escrowContract.read.releasedAmount();
            
            paid = formatUnits(releasedAmount, 6); // USDC has 6 decimals
            
            // State: 0=Active, 1=Completed, 2=Disputed, 3=Cancelled
            if (escrowState === 2) {
              status = 'disputed';
            } else if (escrowState === 1) {
              status = 'completed';
              progress = 100;
              completedCount++;
            } else if (escrowState === 0) {
              status = 'active';
              activeCount++;
              // Calculate progress based on released amount
              const budget = BigInt(job.budget);
              if (budget > 0) {
                progress = Math.floor(Number(releasedAmount * BigInt(100) / budget));
              }
            }

            // Try to get milestone info if available
            try {
              milestonesTotal = Number(await escrowContract.read.totalMilestones());
              milestonesCompleted = Number(await escrowContract.read.completedMilestones());
            } catch {
              // Milestones not implemented, use default
            }
          } catch (err) {
            console.error('Error fetching escrow data:', err);
          }
        }

        const budgetFormatted = formatUnits(job.budget, 6);
        
        if (mode === 'client') {
          totalSpent += BigInt(paid.replace('.', ''));
        } else {
          totalEarned += BigInt(paid.replace('.', ''));
          if (status === 'active') {
            const remaining = BigInt(job.budget) - BigInt(paid.replace('.', ''));
            pendingPayment += remaining;
          }
        }

        processedJobs.push({
          id: jobId,
          title: job.title || `Job #${jobId}`,
          description: job.description || '',
          client: job.client,
          worker: job.selectedWorker || '0x0000000000000000000000000000000000000000',
          budget: budgetFormatted,
          paid,
          status,
          progress,
          milestones: {
            completed: milestonesCompleted,
            total: milestonesTotal
          },
          escrowAddress: job.escrowContract
        });
      }

      // Fetch reputation
      let avgRating = 0;
      try {
        const reputation = await reputationContract.read.getReputation([address]);
        if (reputation && reputation.totalRatings > 0) {
          avgRating = Number(reputation.averageRating) / 10; // Assuming rating is stored as uint8 * 10
        }
      } catch (err) {
        console.error('Error fetching reputation:', err);
      }

      setJobs(processedJobs);
      setStats({
        activeJobs: activeCount,
        totalSpent: (Number(totalSpent) / 1000000).toFixed(1),
        completedJobs: completedCount,
        avgRating: avgRating || 4.5, // Default if no ratings
        totalEarned: (Number(totalEarned) / 1000000).toFixed(1),
        pendingPayment: (Number(pendingPayment) / 1000000).toFixed(1)
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [publicClient, address, mode]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { jobs, stats, loading, error, refetch: fetchDashboardData };
}
