'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Briefcase, Shield, Zap, Users, ArrowRight, CheckCircle, Sparkles, Loader2 } from 'lucide-react';

export function LandingPageClient() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-100 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-100 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 shadow-sm mb-8">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Trustless work, powered by blockchain
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                Where work meets
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white">
                  trust
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                A freelance marketplace built on transparency. Secure escrow, fair arbitration, and instant USDC payments—no intermediaries required.
              </p>

              {/* CTA */}
              <div className="flex flex-col items-center gap-4 mb-16">
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    // If already connected, show nothing (useEffect will redirect)
                    if (mounted && account) {
                      return null;
                    }

                    return (
                      <button
                        onClick={openConnectModal}
                        className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                      >
                        Connect Wallet to Start
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Your wallet is your identity. No signup required.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20">
                <FeatureCard
                  icon={<Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                  title="Secure Escrow"
                  description="Smart contracts hold funds until work is verified and approved"
                />
                <FeatureCard
                  icon={<Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
                  title="Fair Arbitration"
                  description="Decentralized jury resolves disputes with transparent voting"
                />
                <FeatureCard
                  icon={<Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                  title="Instant Payments"
                  description="USDC settlements with no volatility or conversion fees"
                />
                <FeatureCard
                  icon={<Briefcase className="w-6 h-6 text-sky-600 dark:text-sky-400" />}
                  title="Verifiable Reputation"
                  description="On-chain track record that travels with your wallet"
                />
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-zinc-900 py-16 md:py-24 border-y border-slate-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                How it works
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Three simple steps to secure, transparent collaboration
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <StepCard
                number="1"
                title="Connect & Browse"
                description="Link your wallet and explore opportunities or post your project needs"
              />
              <StepCard
                number="2"
                title="Work with Confidence"
                description="Funds secured in escrow while you focus on delivering great work"
              />
              <StepCard
                number="3"
                title="Complete & Earn"
                description="Automatic payment release upon approval. Reputation grows with each job"
              />
            </div>
          </div>
        </div>

        {/* Why Choose Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">
                Why Frizz?
              </h2>
              <div className="space-y-5">
                <BenefitItem text="Zero platform fees—keep what you earn" />
                <BenefitItem text="Trustless escrow eliminates payment risk" />
                <BenefitItem text="Transparent, community-driven dispute resolution" />
                <BenefitItem text="Portable reputation across all platforms" />
                <BenefitItem text="Global access without KYC barriers" />
                <BenefitItem text="Instant USDC settlements on completion" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 dark:from-indigo-500/10 dark:to-emerald-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 relative">
                  Ready to get started?
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed relative">
                  Join a marketplace where trust is built into every transaction. Connect your wallet and start working in seconds.
                </p>
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    // If already connected, show nothing (useEffect will redirect)
                    if (mounted && account) {
                      return null;
                    }

                    return (
                      <button
                        onClick={openConnectModal}
                        className="relative w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-150"
                      >
                        Connect Wallet
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 group">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 mb-4 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white text-xl font-bold mb-5 shadow-sm">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <span className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">{text}</span>
    </div>
  );
}
