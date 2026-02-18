'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { JobList } from '@/components/JobList';
import { PostJobModal } from '@/components/PostJobModal';
import { Footer } from '@/components/Footer';

export default function Home() {
  const [showPostJob, setShowPostJob] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-jobs' | 'applications'>('browse');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar onPostJob={() => setShowPostJob(true)} />
      
      <main className="flex-1">
        <Hero onGetStarted={() => setShowPostJob(true)} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Tabs */}
          <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('browse')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'my-jobs'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              My Jobs
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              My Applications
            </button>
          </div>

          {/* Content */}
          <JobList activeTab={activeTab} />
        </div>
      </main>

      <Footer />

      {showPostJob && <PostJobModal onClose={() => setShowPostJob(false)} />}
    </div>
  );
}
