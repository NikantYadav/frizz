
"use client";

import { useState } from "react";
import { ethers } from "ethers";

interface WorkerProfile {
    address: string;
    name?: string; // Loaded from IPFS
    bio?: string; // Loaded from IPFS
    skills: string[];
    hourlyRate: string;
    reputationScore: number;
    completedJobs: number;
    available: boolean;
}

export default function WorkerCard({ worker, onSelect }: { worker: WorkerProfile; onSelect: (worker: WorkerProfile) => void }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{worker.name || "Anonymous Worker"}</h3>
                    <p className="text-sm text-gray-500 font-mono truncate w-32">{worker.address}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${worker.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                        {worker.available ? "Available" : "Busy"}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Score: {worker.reputationScore}
                    </span>
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {worker.bio || "No bio available."}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {worker.skills.slice(0, 3).map((skill, index) => (
                    <span
                        key={index}
                        className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-100"
                    >
                        {skill}
                    </span>
                ))}
                {worker.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-xs border border-gray-100">
                        +{worker.skills.length - 3}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div>
                    <span className="text-lg font-bold text-gray-900">{worker.hourlyRate} ETH</span>
                    <span className="text-gray-500 text-sm">/hr</span>
                </div>
                <button
                    onClick={() => onSelect(worker)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    View Profile
                </button>
            </div>
        </div>
    );
}
