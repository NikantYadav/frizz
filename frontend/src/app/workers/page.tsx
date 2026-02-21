
"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";
import WorkerList from "@/components/WorkerList";
import SearchFilters from "@/components/SearchFilters";
import { Search, Filter } from "lucide-react";

export default function WorkersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({});

    return (
        <AuthGuard>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <Navbar />

                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Find Talent</h1>
                            <p className="text-base text-gray-600 dark:text-gray-400 mt-1">Discover top-rated workers for your next project.</p>
                        </div>

                        <div className="flex w-full md:w-auto gap-2">
                            <div className="relative flex-1 md:w-64">
                                <input
                                    type="text"
                                    placeholder="Search by skill or name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Filters</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Filters Sidebar */}
                        <div className={`w-full md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
                            <SearchFilters onFilterChange={setFilters} />
                        </div>

                        {/* Results */}
                        <div className="flex-1 w-full">
                            <WorkerList searchTerm={searchTerm} />
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
