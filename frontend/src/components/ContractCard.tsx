
"use client";

import { DollarSign, Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ContractCardProps {
    contract: {
        id: string;
        title: string;
        client: string;
        worker: string;
        budget: string;
        status: "ACTIVE" | "COMPLETED" | "DISPUTED";
        escrowStatus: "FUNDED" | "RELEASED" | "DISPUTED";
        nextMilestone?: string;
    };
    role: "CLIENT" | "WORKER";
}

export default function ContractCard({ contract, role }: ContractCardProps) {
    const isClient = role === "CLIENT";
    const otherParty = isClient ? contract.worker : contract.client;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate w-64">{contract.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isClient ? "Worker" : "Client"}: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{otherParty}</span>
                    </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${contract.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                        contract.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                            "bg-orange-100 text-orange-700"
                    }`}>
                    {contract.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Budget</p>
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        ${(Number(contract.budget) / 1e6).toFixed(2)} USDC
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Next Milestone</p>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                        {contract.nextMilestone || "None"}
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {contract.escrowStatus === "FUNDED" && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {contract.escrowStatus === "DISPUTED" && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    Escrow: {contract.escrowStatus}
                </div>

                <Link
                    href={`/dashboard/${contract.id}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                    View Details <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
