
"use client";

import { CheckCircle, Circle, Clock, DollarSign } from "lucide-react";
import { useState } from "react";

interface Milestone {
    id: number;
    description: string;
    amount: string;
    status: "PENDING" | "COMPLETED" | "PAID";
}

interface MilestoneListProps {
    milestones: Milestone[];
    isClient: boolean;
    onApprove?: (id: number) => void;
    onSubmit?: (id: number) => void;
}

export default function MilestoneList({ milestones, isClient, onApprove, onSubmit }: MilestoneListProps) {
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleAction = async (id: number, action: () => void) => {
        setLoadingId(id);
        await new Promise(r => setTimeout(r, 1000)); // Mock delay
        action();
        setLoadingId(null);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Milestones</h3>
            <div className="space-y-3">
                {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                {milestone.status === "PAID" ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : milestone.status === "COMPLETED" ? (
                                    <Clock className="w-5 h-5 text-blue-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-300" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{milestone.description}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> {milestone.amount} ETH
                                </p>
                            </div>
                        </div>

                        <div>
                            {isClient && milestone.status === "COMPLETED" && (
                                <button
                                    onClick={() => handleAction(milestone.id, () => onApprove?.(milestone.id))}
                                    disabled={loadingId === milestone.id}
                                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loadingId === milestone.id ? "Approving..." : "Approve & Pay"}
                                </button>
                            )}
                            {!isClient && milestone.status === "PENDING" && (
                                <button
                                    onClick={() => handleAction(milestone.id, () => onSubmit?.(milestone.id))}
                                    disabled={loadingId === milestone.id}
                                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loadingId === milestone.id ? "Submitting..." : "Submit Work"}
                                </button>
                            )}
                            {milestone.status === "PAID" && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">PAID</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
