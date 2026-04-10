import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Loader2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobCard } from '../../components/jobs/JobCard';
import API from '../../services/api';

/**
 * DEBOUNCE — Why we use it for search:
 * Without debounce: every keystroke fires an API call.
 * Type "react developer" = 14 API calls! Wastes bandwidth, hammers server.
 *
 * With debounce (500ms delay): only fires AFTER user stops typing for 500ms.
 * Type "react developer" = 1 API call. ✅
 *
 * We implement debounce using useEffect + clearTimeout.
 */

const JOB_TYPES     = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const LOCATION_TYPES = ['remote', 'hybrid', 'onsite'];

export function Jobs() {
    const [jobs, setJobs]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage]           = useState(1);

    // Search + filter state
    const [search, setSearch]         = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [locationType, setLocationType] = useState('');
    const [jobType, setJobType]       = useState('');
    const [minSalary, setMinSalary]   = useState('');

    // Pagination state
    const [pagination, setPagination] = useState({});
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());

    useEffect(() => {
        API.get('/api/applications/my-applications').then(({ data }) => {
            const ids = new Set((data.data || []).map(app => (app.jobId?._id || app.jobId)));
            setAppliedJobIds(ids);
        }).catch(() => {});
    }, []);

    /**
     * DEBOUNCE IMPLEMENTATION:
     * Every time 'search' changes, set a 500ms timer.
     * If search changes again before 500ms, clearTimeout kills the old timer.
     * Only when 500ms passes with no changes does debouncedSearch update → API call fires.
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // reset to page 1 on new search
        }, 500);

        return () => clearTimeout(timer); // cleanup: kill old timer on each keystroke
    }, [search]);

    // Fetch jobs whenever filters or page change
    useEffect(() => {
        fetchJobs();
    }, [debouncedSearch, locationType, jobType, minSalary, page]);

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build query string from active filters
            const params = new URLSearchParams({
                page,
                limit: 12,
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(locationType    && { locationType }),
                ...(jobType         && { jobType }),
                ...(minSalary       && { minSalary }),
            });

            const { data } = await API.get(`/api/jobs?${params}`);
            setJobs(data.data || []);
            setPagination(data.pagination || {});
        } catch (err) {
            setError('Failed to load jobs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setLocationType('');
        setJobType('');
        setMinSalary('');
        setPage(1);
    };

    const hasFilters = search || locationType || jobType || minSalary;

    // Skeleton loader for job cards
    const JobSkeleton = () => (
        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-slate-800" />
                <div className="space-y-1">
                    <div className="w-24 h-3 bg-slate-800 rounded" />
                    <div className="w-16 h-2 bg-slate-800 rounded" />
                </div>
            </div>
            <div className="w-3/4 h-5 bg-slate-800 rounded mb-3" />
            <div className="w-1/2 h-3 bg-slate-800 rounded mb-4" />
            <div className="flex gap-2 mb-4">
                {[1,2,3].map(i => <div key={i} className="w-14 h-5 bg-slate-800 rounded-md" />)}
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-between">
                <div className="w-24 h-4 bg-slate-800 rounded" />
                <div className="w-16 h-4 bg-slate-800 rounded" />
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-1">Find Your Next Role</h1>
                <p className="text-slate-400">
                    {pagination.total ? `${pagination.total} jobs available` : 'Browse opportunities'}
                </p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search jobs, skills, companies..."
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-700 rounded-2xl
                                   text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border font-medium transition-all
                        ${showFilters
                            ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                    <SlidersHorizontal size={16} />
                    Filters
                    {hasFilters && (
                        <span className="w-2 h-2 rounded-full bg-cyan-300" />
                    )}
                </button>
            </div>

            {/* Filter Bar */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-4">
                            {/* Location Type */}
                            <div className="flex flex-wrap gap-2">
                                {LOCATION_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setLocationType(locationType === type ? '' : type)}
                                        className={`px-3 py-1.5 rounded-xl text-sm capitalize transition-all
                                            ${locationType === type
                                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-6 bg-slate-700" />

                            {/* Job Type */}
                            <div className="flex flex-wrap gap-2">
                                {JOB_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setJobType(jobType === type ? '' : type)}
                                        className={`px-3 py-1.5 rounded-xl text-sm capitalize transition-all
                                            ${jobType === type
                                                ? 'bg-purple-500 text-white font-bold'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Min Salary */}
                            <div className="flex items-center gap-2">
                                <label className="text-slate-400 text-sm whitespace-nowrap">Min Salary</label>
                                <input
                                    type="number"
                                    value={minSalary}
                                    onChange={e => setMinSalary(e.target.value)}
                                    placeholder="e.g. 50000"
                                    className="w-32 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm
                                               focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 ml-auto"
                                >
                                    <X size={14} /> Clear all
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 mb-6">
                    {error}
                    <button onClick={fetchJobs} className="ml-3 underline text-sm">Retry</button>
                </div>
            )}

            {/* Jobs Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => <JobSkeleton key={i} />)}
                </div>
            ) : jobs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                >
                    <Briefcase size={48} className="text-slate-700 mb-4" />
                    <p className="text-slate-300 font-semibold text-lg">No jobs found</p>
                    <p className="text-slate-500 text-sm mt-2">Try adjusting your filters or search term.</p>
                    {hasFilters && (
                        <button onClick={clearFilters} className="mt-4 text-cyan-400 text-sm underline">
                            Clear filters
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job, i) => (
                        <JobCard 
                            key={job._id} 
                            job={job} 
                            index={i} 
                            isApplied={appliedJobIds.has(job._id)} 
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                        disabled={!pagination.hasPrev}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-40 hover:bg-slate-700 transition-colors"
                    >
                        Previous
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => (
                            <div key={p} className="flex items-center gap-2">
                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                    <span className="text-slate-600 px-1">…</span>
                                )}
                                <button
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all
                                        ${p === page
                                            ? 'bg-cyan-500 text-slate-950'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    {p}
                                </button>
                            </div>
                        ))}

                    <button
                        disabled={!pagination.hasNext}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl disabled:opacity-40 hover:bg-slate-700 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
