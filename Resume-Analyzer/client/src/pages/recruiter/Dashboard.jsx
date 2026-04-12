import { useState, useEffect } from 'react';
import { 
    Briefcase, 
    Users, 
    Eye, 
    Plus, 
    MoreHorizontal, 
    Edit2, 
    XCircle, 
    ExternalLink,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';

/**
 * Recruiter Dashboard
 * 
 * Shows key performance stats and a list of all jobs posted by the logged-in recruiter.
 * Quick actions to close, edit, or view applicants for each job.
 */
export function RecruiterDashboard() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/api/jobs/recruiter/my-jobs');
            setJobs(data.data || []);
            setStats(data.stats || {});
        } catch (err) {
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseJob = async (id) => {
        if (!window.confirm('Are you sure you want to close this job listing?')) return;
        setDeletingId(id);
        try {
            await API.delete(`/api/jobs/${id}`);
            // Update local state without refetching
            setJobs(prev => prev.map(job => job._id === id ? { ...job, status: 'closed' } : job));
        } catch (err) {
            alert('Error closing job.');
        } finally {
            setDeletingId(null);
        }
    };

    // Helper for status badge
    const StatusBadge = ({ status }) => (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
            ${status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              'bg-slate-800 text-slate-500 border border-slate-700'}`}>
            {status}
        </span>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-cyan-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading your recruiter dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Recruiter Dashboard</h1>
                    <p className="text-slate-400 mt-1">Manage your job postings and applications in one place.</p>
                </div>
                <Link 
                    to="/recruiter/jobs/new"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={20} />
                    Post New Job
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Postings" value={stats?.total || 0} icon={<Briefcase size={20} />} trend={`${stats?.trends?.postingsDiff >= 0 ? '+' : ''}${stats?.trends?.postingsDiff || 0} this month`} trendUp={stats?.trends?.postingsDiff >= 0} color="bg-blue-500/10 text-blue-400" />
                <StatCard label="Job Views" value={stats?.totalViews || 0} icon={<Eye size={20} />} trend={`${stats?.trends?.viewGrowth >= 0 ? '+' : ''}${stats?.trends?.viewGrowth || 0}% vs last week`} trendUp={stats?.trends?.viewGrowth >= 0} color="bg-cyan-500/10 text-cyan-400" />
                <StatCard label="Applications" value={stats?.totalApps || 0} icon={<Users size={20} />} trend={`+${stats?.trends?.todayApps || 0} today`} trendUp={(stats?.trends?.todayApps || 0) > 0} color="bg-emerald-500/10 text-emerald-400" />
                <StatCard label="Conversion" value={`${stats?.totalViews > 0 ? Math.min(((stats.totalApps / stats.totalViews) * 100), 100).toFixed(1) : '0'}%`} icon={<BarChart3 size={20} />} trend="views → apps" trendUp={true} color="bg-purple-500/10 text-purple-400" />
            </div>

            {/* Jobs List - Detailed Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(() => {
                    const filtered = jobs.filter(job => 
                        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        job.locationType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        job.jobType?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    return filtered.length === 0 ? (
                        <div className="lg:col-span-2 p-20 text-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem]">
                            <p className="text-slate-500 font-bold italic">
                                {searchQuery ? `No jobs matching "${searchQuery}"` : 'No jobs posted yet. Start by clicking "Post New Job".'}
                            </p>
                        </div>
                    ) : (
                        filtered.map(job => (
                            <motion.div 
                                key={job._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between gap-6 hover:border-slate-700 transition-all group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner">
                                                <Briefcase size={26} className="text-cyan-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">{job.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <StatusBadge status={job.status} />
                                                    <p className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2" title="Views">
                                                <Eye size={12} className="text-emerald-500" />
                                                <span className="text-xs font-black text-white">{job.viewCount}</span>
                                            </div>
                                            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2" title="Applicants">
                                                <Users size={12} className="text-purple-500" />
                                                <span className="text-xs font-black text-white">{job.applicationCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job Fields Chips */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400">
                                            {job.jobType}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400">
                                            {job.locationType}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400">
                                            {job.location}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-black uppercase text-cyan-500">
                                            {job.salary?.isVisible ? `${job.salary.min / 100000}L - ${job.salary.max / 100000}L ${job.salary.currency}` : 'Competitive'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed italic">
                                        "{job.description.substring(0, 100)}..."
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/50">
                                    <button 
                                        onClick={() => navigate(`/recruiter/jobs/${job._id}/candidates`)}
                                        className="flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-xs hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                                    >
                                        <Users size={14} className="text-purple-500 mb-1 sm:mb-0" />
                                        <span>Candidates</span>
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/recruiter/jobs/${job._id}/edit`)}
                                        className="flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-xs hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                                    >
                                        <Edit2 size={14} className="text-cyan-500 mb-1 sm:mb-0" />
                                        <span>Edit Job</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCloseJob(job._id)}
                                        disabled={job.status === 'closed' || deletingId === job._id}
                                        className="flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-xs hover:border-red-500/50 hover:bg-red-500/5 transition-all disabled:opacity-20"
                                    >
                                        {deletingId === job._id ? <Loader2 size={14} className="animate-spin mb-1 sm:mb-0" /> : <XCircle size={14} className="text-red-500 mb-1 sm:mb-0" />}
                                        <span>{job.status === 'closed' ? 'Closed' : 'Close'}</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    );
                })()}
            </div>

        </div>
    );
}

function StatCard({ label, value, icon, trend, trendUp = true, color }) {
    return (
        <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${color}`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-black text-white">{value}</p>
            </div>
        </div>
    );
}
