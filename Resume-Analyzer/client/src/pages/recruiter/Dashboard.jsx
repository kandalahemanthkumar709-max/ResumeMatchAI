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

            {/* Jobs List */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-white">My Postings</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="text" placeholder="Search postings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/20">
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role Info</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Applicants</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Views</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const filtered = jobs.filter(job => 
                                    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    job.locationType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    job.jobType?.toLowerCase().includes(searchQuery.toLowerCase())
                                );
                                return filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-slate-500 italic">
                                        {searchQuery ? `No jobs matching "${searchQuery}"` : 'No jobs posted yet. Start by clicking "Post New Job".'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(job => (
                                    <tr key={job._id} className="border-b border-slate-800/50 hover:bg-slate-800/10 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                                    <Briefcase size={18} className="text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-bold truncate">{job.title}</p>
                                                    <p className="text-slate-500 text-xs">{job.locationType} • {job.jobType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg text-white font-bold text-sm">
                                                <Users size={12} className="text-cyan-400" />
                                                {job.applicationCount}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg text-white font-bold text-sm">
                                                <Eye size={12} className="text-emerald-400" />
                                                {job.viewCount}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-slate-400 text-xs flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => navigate(`/recruiter/jobs/${job._id}/candidates`)}
                                                    className="p-2 text-slate-500 hover:text-purple-400 bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-purple-500/30"
                                                    title="View AI Ranked Candidates"
                                                >
                                                    <Users size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/jobs/${job._id}`)}
                                                    className="p-2 text-slate-500 hover:text-cyan-400 bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-cyan-500/30"
                                                    title="View Public Link"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button 
                                                    className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg transition-colors border border-transparent"
                                                    title="Edit Post"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleCloseJob(job._id)}
                                                    disabled={job.status === 'closed' || deletingId === job._id}
                                                    className="p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-red-500/30 disabled:opacity-30"
                                                    title="Close Posting"
                                                >
                                                    {deletingId === job._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            );
                            })()}
                        </tbody>
                    </table>
                </div>
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
