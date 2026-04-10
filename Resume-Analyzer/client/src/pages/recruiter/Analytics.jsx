import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    Briefcase, 
    Target, 
    CheckCircle, 
    AlertCircle, 
    TrendingUp, 
    Loader2
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell
} from 'recharts';
import { StatCard } from '../../components/analytics/StatCard';
import API from '../../services/api';

/**
 * RECRUITER ANALYTICS PAGE — Insights for hiring managers
 * Focuses on job performance, applicant funnel, and match statistics.
 */
export default function RecruiterAnalytics() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await API.get('/api/analytics/recruiter');
                setData(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load recruiter analytics.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-cyan-400" size={40} />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center p-10 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400">
            <AlertCircle size={40} className="mb-4" />
            <p className="text-lg font-bold">{error}</p>
        </div>
    );

    const funnelColors = {
        'applied': '#06b6d4',
        'screening': '#3b82f6',
        'interview': '#8b5cf6',
        'offer': '#10b981',
        'rejected': '#f43f5e',
        'withdrawn': '#64748b'
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white">Hiring Dashboard</h1>
                <p className="text-slate-400 mt-1">Monitor recruitment effectiveness and top applicant trends.</p>
            </div>

            {/* ── Metric Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    label="Active Jobs" 
                    value={data?.jobs?.find(j => j._id === 'active')?.count || 0}
                    trend="+2" 
                    icon={Briefcase} 
                />
                <StatCard 
                    label="Total Applications" 
                    value={data?.metrics?.totalApps || 0}
                    trend="+12%" 
                    icon={Users} 
                />
                <StatCard 
                    label="Avg Match Score" 
                    value={`${Math.round(data?.metrics?.avgMatchScore || 0)}%`}
                    trend="+3.1%" 
                    icon={Target} 
                />
                <StatCard 
                    label="Hired Candidates" 
                    value={data?.funnel?.find(f => f._id === 'offer')?.count || 0}
                    trend="+1" 
                    icon={CheckCircle} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                
                {/* ── Application Funnel ──────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Application Funnel</h3>
                    <div className="space-y-6">
                        {data?.funnel?.map((stage, index) => (
                            <div key={index} className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-300 capitalize">{stage._id}</span>
                                    <span className="text-sm font-bold text-white">{stage.count}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stage.count / data.metrics.totalApps) * 100}%` }}
                                        className="h-full" 
                                        style={{ backgroundColor: funnelColors[stage._id] || '#94a3b8' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Top Jobs Performance ─────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Top Performing Jobs</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-800">
                                    <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Job Title</th>
                                    <th className="pb-4 text-xs font-bold text-slate-500 uppercase text-center">Views</th>
                                    <th className="pb-4 text-xs font-bold text-slate-500 uppercase text-right">Apps</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.topJobs?.map((job, index) => (
                                    <tr key={index} className={index !== data.topJobs.length - 1 ? "border-b border-slate-800/50" : ""}>
                                        <td className="py-4 font-semibold text-white text-sm">{job.title}</td>
                                        <td className="py-4 text-center text-slate-300 text-sm">{job.viewCount}</td>
                                        <td className="py-4 text-right">
                                            <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-bold">
                                                {job.applicationCount}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Funnel Insight ─────────────────────────────────────── */}
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Conversion Optimization</h3>
                        <p className="text-slate-500 text-sm">Visualizing the applicant journey from applied to hired.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Screening Rate</p>
                        <p className="text-2xl font-bold text-white">
                            {Math.round((data?.funnel?.find(f => f._id === 'screening')?.count || 0) / (data?.metrics?.totalApps || 1) * 100)}%
                        </p>
                    </div>
                    <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interview Rate</p>
                        <p className="text-2xl font-bold text-white">
                            {Math.round((data?.funnel?.find(f => f._id === 'interview')?.count || 0) / (data?.metrics?.totalApps || 1) * 100)}%
                        </p>
                    </div>
                    <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Offer Rate</p>
                        <p className="text-2xl font-bold text-white">
                            {Math.round((data?.funnel?.find(f => f._id === 'offer')?.count || 0) / (data?.metrics?.totalApps || 1) * 100)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
