'use client';

import { X, DollarSign, User, Calendar, Tag } from 'lucide-react';
import { formatEther } from 'ethers';

interface JobDetailsModalProps {
  job: any;
  onClose: () => void;
  activeTab: string;
}

export function JobDetailsModal({ job, onClose, activeTab }: JobDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {job.title}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {job.category}
              </span>
              <span className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {formatEther(job.budget)} ETH
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.split(',').map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Client
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
              {job.client}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {activeTab === 'browse' && job.isActive && !job.selectedWorker && (
              <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Apply Now
              </button>
            )}
            {activeTab === 'my-jobs' && (
              <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Manage Job
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
