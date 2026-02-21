'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ClientDashboard, WorkerDashboard } from '@/components/dashboard';
import { Briefcase, Wrench } from 'lucide-react';

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [mode, setMode] = useState<'client' | 'worker'>('client');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push('/');
    }
  }, [mounted, isConnected, router]);

  if (!mounted || !isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-100 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                Dashboard
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400">
                {mode === 'client' ? 'Manage your projects and hired workers' : 'Track your work and earnings'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="inline-flex items-center bg-white dark:bg-zinc-900 rounded-xl p-1 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <button
                onClick={() => setMode('client')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                  mode === 'client'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Client</span>
              </button>
              <button
                onClick={() => setMode('worker')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                  mode === 'worker'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Worker</span>
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          {mode === 'client' ? <ClientDashboard /> : <WorkerDashboard />}
        </div>
      </main>
    </div>
  );
}
