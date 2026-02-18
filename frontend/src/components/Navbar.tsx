'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, Plus } from 'lucide-react';

interface NavbarProps {
  onPostJob: () => void;
}

export function Navbar({ onPostJob }: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Frizz
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onPostJob}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Post Job</span>
            </button>
            
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Mobile Post Job Button */}
      <div className="sm:hidden px-4 pb-3">
        <button
          onClick={onPostJob}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Post Job</span>
        </button>
      </div>
    </nav>
  );
}
