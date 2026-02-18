'use client';

import { useState } from 'react';
import { Briefcase, DollarSign, Tag, Calendar, User } from 'lucide-react';
import { JobDetailsModal } from './JobDetailsModal';
import { formatEther } from 'ethers';

interface Job {
  jobId: string;
  title: string;
  description: string;
  skills: string;
  category: string;
  budget: bigint;
  client: string;
  isActive: boolean;
  selectedWorker?: string;
  workSubmitted?: boolean;
}

interface JobCardProps {
  job: Job;
  activeTab: string;
}

export function JobCard({ job, activeTab }: JobCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = () => {
    if (!job.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Closed</span>;
    }
    if (job.selectedWorker) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-200 text-blue-700">In Progress</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-700">Open</span>;
  };

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {job.title}
            </h3>
            {getStatusBadge()}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Tag className="h-4 w-4 mr-2" />
            <span>{job.category}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Briefcase className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{job.skills}</span>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-primary-600 font-semibold">
            <DollarSign className="h-5 w-5 mr-1" />
            <span>{formatEther(job.budget)} ETH</span>
          </div>
          
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View Details →
          </button>
        </div>
      </div>

      {showDetails && (
        <JobDetailsModal
          job={job}
          onClose={() => setShowDetails(false)}
          activeTab={activeTab}
        />
      )}
    </>
  );
}
