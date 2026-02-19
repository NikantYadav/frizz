
"use client";

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, Plus, Menu, X, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onPostJob?: () => void;
}

export function Navbar({ onPostJob }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Frizz
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/workers" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">
              Find Talent
            </Link>
            <Link href="/jobs" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">
              Jobs
            </Link>
            <Link href="/messages" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white font-medium transition-colors flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white font-medium transition-colors">
              Profile
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {onPostJob && (
              <button
                onClick={onPostJob}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
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
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/workers"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Find Talent
            </Link>
            <Link
              href="/jobs"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Jobs
            </Link>
            <Link
              href="/messages"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Messages
            </Link>
            <Link
              href="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
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
