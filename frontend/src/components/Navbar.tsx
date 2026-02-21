"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, Plus, Menu, X, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onPostJob?: () => void;
}

export function Navbar({ onPostJob }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const isLanding = pathname === '/';

  return (
    <nav className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={isConnected ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                Frizz
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Only show if connected and not on landing */}
          {isConnected && !isLanding && (
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/messages" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white font-medium transition-colors flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white font-medium transition-colors">
                Profile
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected && onPostJob && (
              <button
                onClick={onPostJob}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Post Job</span>
              </button>
            )}

            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-4">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
            {isConnected && !isLanding && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - Only show if connected */}
      {isMobileMenuOpen && isConnected && !isLanding && (
        <div className="md:hidden border-t border-slate-200 dark:border-zinc-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/messages"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Messages
            </Link>
            <Link
              href="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Profile
            </Link>

            {onPostJob && (
              <button
                onClick={() => {
                  onPostJob();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800"
              >
                <Plus className="h-5 w-5" />
                <span>Post Job</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
