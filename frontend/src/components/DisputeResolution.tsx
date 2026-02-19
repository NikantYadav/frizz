
"use client";

import { useState } from "react";
import { AlertCircle, Lock, Eye, Send } from "lucide-react";

interface DisputeResolutionProps {
    disputeId: string;
    isJuror: boolean;
    status: "COMMIT" | "REVEAL" | "RESOLVED";
    userHasCommitted: boolean;
    userHasRevealed: boolean;
    commitDeadline: Date;
    revealDeadline: Date;
}

export default function DisputeResolution({
    disputeId,
    isJuror,
    status,
    userHasCommitted,
    userHasRevealed,
    commitDeadline,
    revealDeadline
}: DisputeResolutionProps) {
    const [voteForClient, setVoteForClient] = useState<boolean | null>(null);
    const [salt, setSalt] = useState("");
    const [commitHash, setCommitHash] = useState("");
    const [evidenceLink, setEvidenceLink] = useState("");

    const generateHash = () => {
        if (voteForClient === null || !salt) return;
        // Simulate keccak256 packing
        const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        setCommitHash(mockHash);
    };

    const handleCommit = () => {
        console.log("Committing vote hash:", commitHash);
        // Contract call commitVote(disputeId, commitHash)
    };

    const handleReveal = () => {
        console.log("Revealing vote:", voteForClient, "Salt:", salt);
        // Contract call revealVote(disputeId, voteForClient, salt)
    };

    const handleSubmitEvidence = () => {
        console.log("Submitting evidence:", evidenceLink);
        // Contract call submitEvidence
    };

    if (!isJuror) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Dispute Status: {status}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">You are viewing this dispute as a participant/observer.</p>

                <div className="mb-6">
                    <h4 className="font-medium mb-2">Submit Evidence</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="IPFS Link or Description"
                            className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            value={evidenceLink}
                            onChange={(e) => setEvidenceLink(e.target.value)}
                        />
                        <button
                            onClick={handleSubmitEvidence}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertCircle className="text-orange-500" />
                        Dispute Resolution #{disputeId}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status === "COMMIT" ? "bg-blue-100 text-blue-700" :
                            status === "REVEAL" ? "bg-purple-100 text-purple-700" :
                                "bg-green-100 text-green-700"
                        }`}>
                        {status} Phase
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    {status === "COMMIT" ? `Commit votes by ${commitDeadline.toLocaleDateString()}` :
                        status === "REVEAL" ? `Reveal votes by ${revealDeadline.toLocaleDateString()}` :
                            "Dispute Resolved"}
                </p>
            </div>

            <div className="p-6 space-y-8">

                {/* Step 1: Commit Phase */}
                <div className={`transition-opacity ${status !== "COMMIT" ? "opacity-50 pointer-events-none" : ""}`}>
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-gray-100">
                        <Lock className="w-4 h-4" /> Step 1: Commit Vote
                    </h4>

                    {userHasCommitted ? (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">
                            Vote committed successfully. Wait for reveal phase.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Select your vote and enter a secret salt. This generates a hash to commit securely.</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setVoteForClient(true)}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${voteForClient === true ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300"
                                        }`}
                                >
                                    Vote Client
                                </button>
                                <button
                                    onClick={() => setVoteForClient(false)}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${voteForClient === false ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300"
                                        }`}
                                >
                                    Vote Worker
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-300">Secret Salt (Save this!)</label>
                                <input
                                    type="password"
                                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Enter a random secret phrase..."
                                    value={salt}
                                    onChange={(e) => setSalt(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleCommit}
                                disabled={voteForClient === null || !salt}
                                className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                                Generate Hash & Commit
                            </button>

                            {commitHash && (
                                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                                    Hash: {commitHash}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700"></div>

                {/* Step 2: Reveal Phase */}
                <div className={`transition-opacity ${status !== "REVEAL" ? "opacity-50 pointer-events-none" : ""}`}>
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-gray-100">
                        <Eye className="w-4 h-4" /> Step 2: Reveal Vote
                    </h4>

                    {userHasRevealed ? (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">
                            Vote revealed successfully.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Re-enter your vote and salt to verify and count your vote.</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setVoteForClient(true)}
                                    className={`flex-1 py-2 px-3 rounded-lg border font-medium ${voteForClient === true ? "bg-blue-50 border-blue-500" : "border-gray-200 dark:border-gray-600 dark:text-gray-300"
                                        }`}
                                >
                                    Client
                                </button>
                                <button
                                    onClick={() => setVoteForClient(false)}
                                    className={`flex-1 py-2 px-3 rounded-lg border font-medium ${voteForClient === false ? "bg-blue-50 border-blue-500" : "border-gray-200 dark:border-gray-600 dark:text-gray-300"
                                        }`}
                                >
                                    Worker
                                </button>
                            </div>
                            <input
                                type="password"
                                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Re-enter your secret salt..."
                                value={salt}
                                onChange={(e) => setSalt(e.target.value)}
                            />
                            <button
                                onClick={handleReveal}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                            >
                                Reveal Vote
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
