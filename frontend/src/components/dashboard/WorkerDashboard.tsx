'use client';

import { useState } from 'react';
import { 
  Wrench,
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Search,
  Star,
  Calendar,
  FileText,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAccount } from 'wagmi';

export function WorkerDashboard() {
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { jobs: gigs, stats, loading, error } = useDashboardData('worker');

  const filteredGigs = gigs.filter(gig => {
    const matchesFilter = activeFilter === 'all' || gig.status === activeFilter;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase());
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
          icon={<Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          label="Active Gigs"
          value={stats.activeJobs.toString()}
          trend="+1 this week"
          trendUp
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Total Earned"
          value={`${stats.totalEarned} USDC`}
          trend={`${stats.pendingPayment} pending`}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
          label="Completed"
          value={stats.completedJobs.toString()}
          trend="100% success rate"
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          label="Rating"
          value={stats.avgRating.toFixed(1)}
          trend={`From ${stats.completedJobs} reviews`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard" className="group">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 dark:bg-indigo-500">
                <Search className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Browse</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Find New Work</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Explore available jobs</p>
          </div>
        </Link>

        <Link href="/profile" className="group">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Profile</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Build Reputation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Update your profile</p>
          </div>
        </Link>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-600 dark:bg-amber-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Earnings</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{stats.pendingPayment} USDC</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Pending payment</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            label="All Gigs"
            count={gigs.length}
          />
          <FilterButton
            active={activeFilter === 'active'}
            onClick={() => setActiveFilter('active')}
            label="Active"
            count={gigs.filter(g => g.status === 'active').length}
          />
          <FilterButton
            active={activeFilter === 'pending'}
            onClick={() => setActiveFilter('pending')}
            label="Pending"
            count={gigs.filter(g => g.status === 'pending').length}
          />
          <FilterButton
            active={activeFilter === 'completed'}
            onClick={() => setActiveFilter('completed')}
            label="Completed"
            count={gigs.filter(g => g.status === 'completed').length}
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 text-sm"
          />
        </div>
      </div>

      {/* Gigs List */}
      <div className="space-y-4">
        {filteredGigs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <Wrench className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No gigs found</p>
          </div>
        ) : (
          filteredGigs.map(gig => (
            <GigCard key={gig.id} gig={gig} />
          ))
        )}
      </div>
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

function GigCard({ gig }: { gig: any }) {
  const statusConfig = {
    active: {
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/50',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-900/50',
      icon: <Clock className="w-4 h-4" />,
      label: 'In Progress'
    },
    pending: {
      bgColor: 'bg-amber-100 dark:bg-amber-950/50',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
      icon: <Calendar className="w-4 h-4" />,
      label: 'Pending Start'
    },
    completed: {
      bgColor: 'bg-sky-100 dark:bg-sky-950/50',
      textColor: 'text-sky-700 dark:text-sky-400',
      borderColor: 'border-sky-200 dark:border-sky-900/50',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Completed'
    },
    disputed: {
      bgColor: 'bg-rose-100 dark:bg-rose-950/50',
      textColor: 'text-rose-700 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-900/50',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Disputed'
    }
  };

  const config = statusConfig[gig.status as keyof typeof statusConfig];

  return (
    <Link href={`/dashboard/${gig.id}`}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Gig Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {gig.title}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor} whitespace-nowrap`}>
                {config.icon}
                {config.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
              <span className="font-mono text-xs">{gig.client.slice(0, 6)}...{gig.client.slice(-4)}</span>
            </div>

            {/* Progress Bar */}
            {(gig.status === 'active' || gig.status === 'pending') && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                  <span>Progress: {gig.milestones.completed}/{gig.milestones.total} milestones</span>
                  <span>{gig.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${gig.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Earnings & Deadline */}
          <div className="flex lg:flex-col items-end justify-between lg:justify-start gap-4 lg:gap-3 lg:text-right">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                {gig.status === 'completed' ? 'Earned' : 'Budget'}
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white">{gig.budget} USDC</div>
              {gig.status !== 'completed' && gig.status !== 'pending' && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Earned: {gig.paid} USDC</div>
              )}
            </div>

            {gig.deadline && gig.status !== 'completed' && (
              <div className="text-sm">
                <div className="text-slate-600 dark:text-slate-400">Due</div>
                <div className="font-medium text-slate-900 dark:text-white">{new Date(gig.deadline).toLocaleDateString()}</div>
              </div>
            )}

            {gig.completedDate && gig.status === 'completed' && (
              <div className="text-sm">
                <div className="text-slate-600 dark:text-slate-400">Completed</div>
                <div className="font-medium text-slate-900 dark:text-white">{new Date(gig.completedDate).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
