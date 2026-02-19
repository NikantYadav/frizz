
"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import ContractCard from "@/components/ContractCard";
import { LayoutDashboard, CheckSquare, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";

export default function DashboardPage() {
    const { address } = useAccount();
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "DISPUTED">("ACTIVE");

    // Mock data for MVP
    const contracts = [
        {
            id: "1",
            title: "DeFi Frontend Implementation",
            client: "0xClient...",
            worker: "0xWorker...",
            budget: "5.0",
            status: "ACTIVE" as const,
            escrowStatus: "FUNDED" as const,
            nextMilestone: "UI Components"
        },
        {
            id: "2",
            title: "Smart Contract Audit",
            client: "0xClient2...",
            worker: "0xWorker...",
            budget: "2.5",
            status: "COMPLETED" as const,
            escrowStatus: "RELEASED" as const
        },
        {
            id: "3",
            title: "NFT Marketplace Backend",
            client: "0xClient...",
            worker: "0xWorker2...",
            budget: "10.0",
            status: "DISPUTED" as const,
            escrowStatus: "DISPUTED" as const
        }
    ];

    const filteredContracts = contracts.filter(c => c.status === activeTab);

    if (!address) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-gray-600">Please connect your wallet to view dashboard.</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Contract Dashboard</h1>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab("ACTIVE")}
                        className={`py-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === "ACTIVE"
                                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> Active Contracts
                    </button>
                    <button
                        onClick={() => setActiveTab("COMPLETED")}
                        className={`py-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === "COMPLETED"
                                ? "border-green-600 text-green-600 dark:text-green-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <CheckSquare className="w-4 h-4" /> Completed
                    </button>
                    <button
                        onClick={() => setActiveTab("DISPUTED")}
                        className={`py-2 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === "DISPUTED"
                                ? "border-orange-600 text-orange-600 dark:text-orange-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <AlertCircle className="w-4 h-4" /> Disputed
                    </button>
                </div>

                {/* Contract Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContracts.map(contract => (
                        <ContractCard
                            key={contract.id}
                            contract={contract}
                            role="CLIENT" // Mock role
                        />
                    ))}
                    {filteredContracts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                            No contracts found in this category.
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
