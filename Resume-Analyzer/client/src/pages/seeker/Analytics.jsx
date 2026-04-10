import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FileText, 
    Briefcase, 
    Target, 
    TrendingUp, 
    AlertCircle, 
    BarChart3, 
    PieChart as PieIcon,
    Loader2
} from 'lucide-react';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { StatCard } from '../../components/analytics/StatCard';
import API from '../../services/api';

/**
 * SEEKER ANALYTICS PAGE — Advanced insights for job seekers
 * Uses Recharts for all visual data.
 */
export default function SeekerAnalytics() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await API.get('/api/analytics/seeker');
                setData(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load analytics.');
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

    // Prepare chart data
    const timelineData = data?.timeline?.map(t => ({
        week: `Week ${t._id}`,
        applications: t.count
    }));

    const statusData = data?.applications?.map(s => ({
        name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
        value: s.count
    }));

    const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white">Dashboard & Analytics</h1>
                <p className="text-slate-400 mt-1">Track your job search progress and AI matching insights.</p>
            </div>

            {/* ── Metric Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    label="Total Resumes" 
                    value={data?.resumes?.totalResumes || 0}
                    trend="+12%" 
                    icon={FileText} 
                />
                <StatCard 
                    label="Avg ATS Score" 
                    value={`${Math.round(data?.resumes?.avgAtsScore || 0)}%`}
                    trend="+5.4%" 
                    icon={Target} 
                />
                <StatCard 
                    label="Total Applications" 
                    value={data?.timeline?.reduce((acc, t) => acc + t.count, 0) || 0}
                    trend="+18%" 
                    icon={Briefcase} 
                />
                <StatCard 
                    label="Job Matches" 
                    value={data?.matches?.reduce((acc, m) => acc + m.count, 0) || 0}
                    trend="+8%" 
                    icon={BarChart3} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                
                {/* ── Applications Over Time ────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Applications Over Time</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#06b6d4' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="applications" 
                                    stroke="#06b6d4" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorApps)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Status Breakdown ─────────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Application Status</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ── Match Score Distribution ────────────────────────── */}
                <div className="lg:col-span-2 p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Match Score Distribution</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.matches}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                <XAxis 
                                    dataKey="_id" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickFormatter={(val) => val === 'Other' ? 'Other' : `${val}%` } 
                                />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#1e293b', opacity: 0.4}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Top Missing Skills ───────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Critically Missing Skills</h3>
                    <div className="space-y-4">
                        {data?.missingSkills?.length > 0 ? (
                            data.missingSkills.map((skill, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <span className="text-slate-300 text-sm">{skill._id}</span>
                                    </div>
                                    <span className="text-slate-500 text-xs">Required in {skill.count} jobs</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-10">No skill gaps detected yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
