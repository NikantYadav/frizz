"use client";

import { useState } from "react";
import WorkerCard from "./WorkerCard";
import { useWorkers } from "@/hooks/useWorkers";

interface WorkerListProps {
    skillFilter?: string;
    searchTerm?: string;
}

export default function WorkerList({ skillFilter, searchTerm }: WorkerListProps) {
    const { workers, loading, error } = useWorkers(skillFilter);

    const filtered = workers.filter(w => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            w.name?.toLowerCase().includes(term) ||
            w.bio?.toLowerCase().includes(term) ||
            w.skills.some(s => s.toLowerCase().includes(term))
        );
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500 dark:text-red-400">
                <p>Failed to load workers: {error}</p>
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No workers found{searchTerm ? ` matching "${searchTerm}"` : ""}.</p>
                <p className="text-sm mt-2">Workers will appear here once they register on-chain.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((worker, idx) => (
                <WorkerCard
                    key={worker.address || idx}
                    worker={worker}
                    onSelect={(w) => console.log("Selected", w)}
                />
            ))}
        </div>
    );
}
