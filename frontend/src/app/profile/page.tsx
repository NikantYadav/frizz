"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import ReputationView from "@/components/ReputationView";
import { useAccount } from "wagmi";
import { useReputation } from "@/hooks/useReputation";
import { useWorkerProfile } from "@/hooks/useWorkerProfile";
import { Turnstile } from '@marsidev/react-turnstile';

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const { reputation, loading: repLoading } = useReputation(address);
    const { saveProfile, loading: saving, error: saveError } = useWorkerProfile();
    const [isEditing, setIsEditing] = useState(false);

    // Cloudflare Turnstile token
    const [turnstileToken, setTurnstileToken] = useState<string>("");

    const [profile, setProfile] = useState({
        name: "",
        bio: "",
        skills: "",
        hourlyRate: "0.05",
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

    if (!isConnected) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-gray-600 dark:text-gray-400">Please connect your wallet to view profile.</p>
                </main>
                <Footer />
            </div>
        );
    }

    const displayReputation = reputation ?? {
        score: 0, completedJobs: 0, disputeWins: 0,
        disputeLosses: 0, totalVolume: "0", ratingsSum: 0, ratingCount: 0
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

                {saveError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        {saveError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Edit Profile */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Worker Profile</h2>
                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    disabled={saving}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                                >
                                    {saving ? "Saving on-chain..." : isEditing ? "Save to Blockchain" : "Edit Profile"}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 px-3 py-2 disabled:opacity-60"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                                    <textarea
                                        disabled={!isEditing}
                                        rows={4}
                                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 px-3 py-2 disabled:opacity-60"
                                        value={profile.bio}
                                        onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                        placeholder="Describe your experience..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills (comma separated)</label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 px-3 py-2 disabled:opacity-60"
                                        value={profile.skills}
                                        onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                        placeholder="Solidity, React, TypeScript"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hourly Rate (ETH)</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        disabled={!isEditing}
                                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 px-3 py-2 disabled:opacity-60"
                                        value={profile.hourlyRate}
                                        onChange={e => setProfile({ ...profile, hourlyRate: e.target.value })}
                                    />
                                </div>

                                {isEditing && (
                                    <div className="mt-6 flex justify-center">
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

                    {/* Right Column: Reputation */}
                    <div className="space-y-6">
                        {repLoading ? (
                            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        ) : (
                            <ReputationView reputation={displayReputation} />
                        )}

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Wallet Address</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-400 font-mono break-all">{address}</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
