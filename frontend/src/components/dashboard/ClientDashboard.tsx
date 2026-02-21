'use client';

import { useState } from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Users,
  Plus,
  Search,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAccount } from 'wagmi';
import { PostJobModal } from '@/components/PostJobModal';

export function ClientDashboard() {
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'disputed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostJob, setShowPostJob] = useState(false);
  
  const { jobs, stats, loading, error, refetch } = useDashboardData('client');

  const handleJobPosted = () => {
    // Refresh the dashboard data after posting a job
    refetch();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = activeFilter === 'all' || job.status === activeFilter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          label="Active Jobs"
          value={stats.activeJobs.toString()}
          trend="+2 this month"
          trendUp
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Total Spent"
          value={`${stats.totalSpent} USDC`}
          trend="Across 17 jobs"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
          label="Completed"
          value={stats.completedJobs.toString()}
          trend="94% success rate"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          label="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          trend="From workers"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            label="All Jobs"
            count={jobs.length}
          />
          <FilterButton
            active={activeFilter === 'active'}
            onClick={() => setActiveFilter('active')}
            label="Active"
            count={jobs.filter(j => j.status === 'active').length}
          />
          <FilterButton
            active={activeFilter === 'completed'}
            onClick={() => setActiveFilter('completed')}
            label="Completed"
            count={jobs.filter(j => j.status === 'completed').length}
          />
          <FilterButton
            active={activeFilter === 'disputed'}
            onClick={() => setActiveFilter('disputed')}
            label="Disputed"
            count={jobs.filter(j => j.status === 'disputed').length}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 text-sm"
            />
          </div>
          <button
            onClick={() => setShowPostJob(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-150 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Job</span>
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <Briefcase className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No jobs found</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))
        )}
      </div>

      {/* Post Job Modal */}
      {showPostJob && (
        <PostJobModal 
          onClose={() => setShowPostJob(false)} 
          onSuccess={handleJobPosted}
        />
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  trendUp 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</div>
      {trend && (
        <div className={`text-xs ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
          {trend}
        </div>
      )}
    </div>
  );
}

function FilterButton({ 
  active, 
  onClick, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
          : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
      }`}
    >
      {label} <span className="opacity-60">({count})</span>
    </button>
  );
}

function JobCard({ job }: { job: any }) {
  const statusConfig = {
    active: {
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/50',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-900/50',
      icon: <Clock className="w-4 h-4" />,
      label: 'In Progress'
    },
    completed: {
      bgColor: 'bg-sky-100 dark:bg-sky-950/50',
      textColor: 'text-sky-700 dark:text-sky-400',
      borderColor: 'border-sky-200 dark:border-sky-900/50',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Completed'
    },
    disputed: {
      bgColor: 'bg-amber-100 dark:bg-amber-950/50',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Disputed'
    },
    pending: {
      bgColor: 'bg-slate-100 dark:bg-slate-950/50',
      textColor: 'text-slate-700 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-900/50',
      icon: <Clock className="w-4 h-4" />,
      label: 'Pending'
    }
  };

  const config = statusConfig[job.status as keyof typeof statusConfig];
  const workerAddress = job.worker !== '0x0000000000000000000000000000000000000000' ? job.worker : null;

  return (
    <Link href={`/dashboard/${job.id}`}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {job.title}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor} whitespace-nowrap`}>
                {config.icon}
                {config.label}
              </span>
            </div>

            {workerAddress ? (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                <Users className="w-4 h-4" />
                <span className="font-mono text-xs">{workerAddress.slice(0, 6)}...{workerAddress.slice(-4)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 mb-3">
                <Users className="w-4 h-4" />
                <span className="italic">No worker assigned</span>
              </div>
            )}

            {/* Progress Bar */}
            {job.status === 'active' && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                  <span>Progress: {job.milestones.completed}/{job.milestones.total} milestones</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}

            {job.status === 'disputed' && job.disputeReason && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">{job.disputeReason}</p>
              </div>
            )}
          </div>

          {/* Right: Budget & Actions */}
          <div className="flex lg:flex-col items-end justify-between lg:justify-start gap-4 lg:gap-3 lg:text-right">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Budget</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white">{job.budget} USDC</div>
              <div className="text-xs text-slate-500 dark:text-slate-500">Paid: {job.paid} USDC</div>
            </div>

            {job.deadline && job.status === 'active' && (
              <div className="text-sm">
                <div className="text-slate-600 dark:text-slate-400">Due</div>
                <div className="font-medium text-slate-900 dark:text-white">{new Date(job.deadline).toLocaleDateString()}</div>
              </div>
            )}

            {job.completedDate && job.status === 'completed' && (
              <div className="text-sm">
                <div className="text-slate-600 dark:text-slate-400">Completed</div>
                <div className="font-medium text-slate-900 dark:text-white">{new Date(job.completedDate).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
