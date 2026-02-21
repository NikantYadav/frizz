'use client';

import { useState } from 'react';
import { X, DollarSign, FileText, Tag, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { usePostJob } from '@/hooks/usePostJob';

interface PostJobModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function PostJobModal({ onClose, onSuccess }: PostJobModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    skills: '',
    category: 'development'
  });
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');

  const { postJob, loading, error } = usePostJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setTxStatus('pending');
      const result = await postJob(
        formData.title,
        formData.description,
        formData.skills,
        formData.category,
        formData.budget
      );

      setTxHash(result.hash);
      setTxStatus('success');

      // Wait a bit to show success message, then close and refresh
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to post job:', err);
      setTxStatus('error');
    }
  };

  const isFormValid = formData.title && formData.description && formData.budget && formData.skills;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Post a New Job</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Status */}
        {txStatus === 'pending' && (
          <div className="mx-6 mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Posting job to blockchain...</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">Please confirm the transaction in your wallet. You'll only pay network fees (gas).</p>
            </div>
          </div>
        )}

        {txStatus === 'success' && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Job posted successfully!</p>
              {txHash && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono truncate">
                  Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}

        {txStatus === 'error' && error && (
          <div className="mx-6 mt-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-900 dark:text-rose-300">Failed to post job</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Job Title
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Build a DeFi Dashboard"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              required
              rows={5}
              disabled={loading}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project requirements, deliverables, and timeline..."
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Budget (USDC)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                disabled={loading}
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Required Skills
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                disabled={loading}
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g., Solidity, React, TypeScript"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-500">Separate multiple skills with commas</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <select
              disabled={loading}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="writing">Writing</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-150 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Post Job'
              )}
            </button>
          </div>

          {/* Gas Fee Notice */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
              ⓘ Network fees (gas) apply for blockchain transactions. Your job budget is separate and held in escrow.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
