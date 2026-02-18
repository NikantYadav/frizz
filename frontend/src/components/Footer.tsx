'use client';

import { Github, Twitter, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About Frizz
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Decentralized work marketplace with secure escrow and fair dispute resolution powered by blockchain technology.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">
                <FileText className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2024 Frizz Marketplace. Built with ❤️ on Ethereum.</p>
        </div>
      </div>
    </footer>
  );
}
