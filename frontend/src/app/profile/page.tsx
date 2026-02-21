"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import ReputationView from "@/components/ReputationView";
import { useAccount } from "wagmi";
import { useReputation } from "@/hooks/useReputation";
import { useWorkerProfile } from "@/hooks/useWorkerProfile";
import { Turnstile } from '@marsidev/react-turnstile';
import { User, Briefcase, DollarSign, Edit2, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { address } = useAccount();
    const { reputation, loading: repLoading } = useReputation(address);
    const { saveProfile, loading: saving, error: saveError } = useWorkerProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string>("");

    const [profile, setProfile] = useState({
        name: "",
        bio: "",
        skills: "",
        hourlyRate: "50",
    });

    const handleSave = async () => {
        try {
            if (!turnstileToken) {
                alert("Please complete the captcha.");
                return;
            }
            await saveProfile(profile.name, profile.bio, profile.skills, profile.hourlyRate, turnstileToken);
            setIsEditing(false);
        } catch (e) {
            // error shown via saveError
        }
    };

    const displayReputation = reputation ?? {
        score: 0, completedJobs: 0, disputeWins: 0,
        disputeLosses: 0, totalVolume: "0"
    };

    return (
        <AuthGuard>
            <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-100 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950">
                <Navbar />

                <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                            My Profile
                        </h1>
                        <p className="text-base text-slate-600 dark:text-slate-400">
                            Manage your worker profile and view your reputation
                        </p>
                    </div>

                    {/* Error Message */}
                    {saveError && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                            <p className="text-sm text-rose-700 dark:text-rose-400">{saveError}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Edit Profile */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50">
                                            <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Worker Profile</h2>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Your on-chain identity</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-150 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="hidden sm:inline">Saving...</span>
                                            </>
                                        ) : isEditing ? (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span className="hidden sm:inline">Save to Chain</span>
                                                <span className="sm:hidden">Save</span>
                                            </>
                                        ) : (
                                            <>
                                                <Edit2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Edit Profile</span>
                                                <span className="sm:hidden">Edit</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                            value={profile.name}
                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                            placeholder="Your name or pseudonym"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            disabled={!isEditing}
                                            rows={4}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                                            value={profile.bio}
                                            onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                            placeholder="Describe your experience and expertise..."
                                        />
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Skills
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                            value={profile.skills}
                                            onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                            placeholder="e.g., Solidity, React, TypeScript"
                                        />
                                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-500">Separate multiple skills with commas</p>
                                    </div>

                                    {/* Hourly Rate */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Hourly Rate (USDC)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="number"
                                                step="1"
                                                disabled={!isEditing}
                                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                                value={profile.hourlyRate}
                                                onChange={e => setProfile({ ...profile, hourlyRate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Turnstile Captcha */}
                                    {isEditing && (
                                        <div className="pt-4 flex justify-center">
                                            <Turnstile
                                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                                onSuccess={(token) => setTurnstileToken(token)}
                                                onError={() => setTurnstileToken("")}
                                                onExpire={() => setTurnstileToken("")}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Reputation & Wallet */}
                        <div className="space-y-6">
                            {/* Reputation */}
                            {repLoading ? (
                                <div className="h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 animate-pulse" />
                            ) : (
                                <ReputationView reputation={displayReputation} />
                            )}

                            {/* Wallet Address */}
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 dark:bg-indigo-500">
                                        <Briefcase className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Wallet Address</h3>
                                </div>
                                <p className="text-sm text-indigo-800 dark:text-indigo-400 font-mono break-all leading-relaxed">
                                    {address}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
