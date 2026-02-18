'use client';

import { Shield, Users, Zap } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Decentralized Work Marketplace
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            Secure freelance platform with escrow protection and fair dispute resolution
          </p>
          
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started
          </button>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center">
              <Shield className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Escrow</h3>
              <p className="text-primary-100">
                Funds locked safely until work is completed
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <Users className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fair Arbitration</h3>
              <p className="text-primary-100">
                Staked jurors resolve disputes fairly
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <Zap className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast Payments</h3>
              <p className="text-primary-100">
                Instant crypto payments on completion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
