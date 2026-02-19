
"use client";

import { Star, Award, TrendingUp, AlertTriangle } from "lucide-react";

interface ReputationProps {
    score: number;
    completedJobs: number;
    disputeWins: number;
    disputeLosses: number;
    totalVolume: string; // ETH
}

export default function ReputationView({ reputation }: { reputation: ReputationProps }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reputation & Trust</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Trust Score</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{reputation.score}/100</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Completed Jobs</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{reputation.completedJobs}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dispute History</span>
                    <span className="text-xs text-gray-500">Volume: {reputation.totalVolume} ETH</span>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center text-green-600 text-sm">
                        <span className="font-bold mr-1">{reputation.disputeWins}</span> Wins
                    </div>
                    <div className="flex items-center text-red-600 text-sm">
                        <span className="font-bold mr-1">{reputation.disputeLosses}</span> Losses
                    </div>
                </div>
            </div>
        </div>
    );
}
