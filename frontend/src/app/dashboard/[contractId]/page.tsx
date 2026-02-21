
"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import MilestoneList from "@/components/MilestoneList";
import DisputeResolution from "@/components/DisputeResolution";
import { CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ContractDetailPage() {
    const params = useParams();
    const contractId = params.contractId as string;
    const isClient = true; // Mock role

    // Mock Data
    const contract = {
        id: contractId,
        title: "DeFi Frontend Implementation",
        client: "0xClient...",
        worker: "0xWorker...",
        budget: "5.0",
        description: "Build a responsive DeFi dashboard using React and TailwindCSS. Integrate with Wagmi for wallet connection.",
        status: "ACTIVE", // ACTIVE, COMPLETED, DISPUTED
        disputeId: "42",
        milestones: [
            { id: 1, description: "UI Design & Components", amount: "1.0", status: "PAID" },
            { id: 2, description: "Wallet Integration", amount: "2.0", status: "COMPLETED" },
            { id: 3, description: "Final Testing & Deployment", amount: "2.0", status: "PENDING" }
        ]
    };

    // Mock Dispute State
    const disputeState = {
        status: "COMMIT" as const, // COMMIT, REVEAL, RESOLVED
        userHasCommitted: false,
        userHasRevealed: false,
        commitDeadline: new Date(Date.now() + 86400000 * 2),
        revealDeadline: new Date(Date.now() + 86400000 * 5)
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Link href="/dashboard" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{contract.title}</h1>
                            <div className="flex gap-4 text-sm text-gray-500">
                                <span>Client: {contract.client}</span>
                                <span>Worker: {contract.worker}</span>
                                <span>Budget: ${contract.budget} USDC</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${contract.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                                    contract.status === "DISPUTED" ? "bg-orange-100 text-orange-700" :
                                        "bg-green-100 text-green-700"
                                }`}>
                                {contract.status}
                            </span>
                            {contract.status === "ACTIVE" && (
                                <button className="text-red-600 hover:text-red-700 text-xs font-medium">Raise Dispute</button>
                            )}
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">{contract.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Milestones */}
                    <div className="lg:col-span-2 space-y-6">
                        <MilestoneList
                            milestones={contract.milestones as any}
                            isClient={isClient}
                            onApprove={(id) => console.log("Approve", id)}
                            onSubmit={(id) => console.log("Submit", id)}
                        />
                    </div>

                    {/* Right Col: Dispute Resolution (Conditional) */}
                    <div className="space-y-6">
                        {contract.status === "DISPUTED" || true ? ( // Force true for demo
                            <DisputeResolution
                                disputeId={contract.disputeId}
                                isJuror={true} // Mock: user is also a juror
                                {...disputeState}
                            />
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> Everything looks good
                                </h3>
                                <p className="text-sm text-blue-800 dark:text-blue-400">
                                    Work is proceeding as planned. Funds are secure in escrow.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
