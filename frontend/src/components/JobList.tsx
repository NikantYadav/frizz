'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { JobCard } from './JobCard';
import { useJobs } from '@/hooks/useJobs';
import { Loader2 } from 'lucide-react';

interface JobListProps {
  activeTab: 'browse' | 'my-jobs' | 'applications';
}

export function JobList({ activeTab }: JobListProps) {
  const { address } = useAccount();
  const { jobs, loading, error, refetch } = useJobs(activeTab, address);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 dark:text-red-400">Error loading jobs: {error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!address && activeTab !== 'browse') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view {activeTab === 'my-jobs' ? 'your jobs' : 'your applications'}
        </p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400">
          {activeTab === 'browse' && 'No jobs available yet'}
          {activeTab === 'my-jobs' && 'You haven\'t posted any jobs yet'}
          {activeTab === 'applications' && 'You haven\'t applied to any jobs yet'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter */}
      {activeTab === 'browse' && (
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'Development', 'Design', 'Marketing', 'Writing'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs
          .filter((job) => filter === 'all' || job.category === filter)
          .map((job) => (
            <JobCard key={job.jobId} job={job} activeTab={activeTab} />
          ))}
      </div>
    </div>
  );
}
