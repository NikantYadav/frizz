
"use client";

import { useState } from "react";
import { Filter, DollarSign } from "lucide-react";

interface SearchFiltersProps {
    onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
    const [maxRate, setMaxRate] = useState(100);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    const commonSkills = ["Solidity", "React", "Rust", "Python", "Design", "Auditing"];

    const toggleSkill = (skill: string) => {
        const newSkills = selectedSkills.includes(skill)
            ? selectedSkills.filter(s => s !== skill)
            : [...selectedSkills, skill];
        setSelectedSkills(newSkills);
        // Trigger update
        onFilterChange({ maxRate, skills: newSkills });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 w-full md:w-64 flex-shrink-0 h-fit">
            <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>

            <div className="space-y-6">
                {/* Skills */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {commonSkills.map(skill => (
                            <button
                                key={skill}
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedSkills.includes(skill)
                                    ? "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hourly Rate */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Max Hourly Rate
                    </h4>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={maxRate}
                        onChange={(e) => setMaxRate(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>$0</span>
                        <span>${maxRate} USDC</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

