
"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { useJobs } from "@/hooks/useJobs";
import { Search, Filter } from "lucide-react";

export default function JobsPage() {
    const { jobs, loading, error } = useJobs("browse");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Find Jobs</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Browse open opportunities and apply with your profile.</p>
                    </div>

                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                        <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">
                        Failed to load jobs. Please try again later.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredJobs.map((job) => (
                            <JobCard key={job.jobId} job={job} activeTab="browse" />
                        ))}
                        {filteredJobs.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No jobs found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
