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

    // Mock radar data based on aggregate strengths (in real app, this would be computed from resume skill counts)
    const radarData = [
        { subject: 'Frontend', A: 85, fullMark: 100 },
        { subject: 'Backend',  A: 65,  fullMark: 100 },
        { subject: 'DevOps',   A: 40,  fullMark: 100 },
        { subject: 'Mobile',   A: 55,  fullMark: 100 },
        { subject: 'AI/ML',    A: 90,  fullMark: 100 },
        { subject: 'Design',   A: 70,  fullMark: 100 },
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">AI Talent Insights</h1>
                    <p className="text-slate-500 mt-1 font-medium">Visualizing your career trajectory and matching precision.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Engine Active</span>
                </div>
            </div>

            {/* ── Metric Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Resumes" value={data?.resumes?.totalResumes || 0} icon={FileText} />
                <StatCard label="Avg ATS Score" value={`${Math.round(data?.resumes?.avgAtsScore || 0)}%`} icon={Target} />
                <StatCard label="Applications" value={data?.timeline?.reduce((acc, t) => acc + t.count, 0) || 0} icon={Briefcase} />
                <StatCard label="Job Matches" value={data?.matches?.reduce((acc, m) => acc + m.count, 0) || 0} icon={BarChart3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* ── Skill Radar ─────────────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-[32px] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target size={120} className="text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp size={20} className="text-cyan-400" />
                        Domain Specialization
                    </h3>
                    <div className="h-72 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                />
                                <Radar
                                    name="You"
                                    dataKey="A"
                                    stroke="#06b6d4"
                                    fill="#06b6d4"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Applications Over Time ────────────────────────────── */}
                <div className="lg:col-span-2 p-8 bg-slate-900/40 border border-slate-800 rounded-[32px]">
                    <h3 className="text-lg font-bold text-white mb-6">Application Momentum</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                                <XAxis dataKey="week" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                                />
                                <Area type="monotone" dataKey="applications" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* ── Status Breakdown ─────────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[32px]">
                    <h3 className="text-lg font-bold text-white mb-6">Pipeline Health</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                    {statusData?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Top Missing Skills ───────────────────────────────── */}
                <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             <TrendingUp size={20} className="text-red-400" />
                             Critical Upskilling Needs
                        </h3>
                        <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded leading-none">High Priority</span>
                    </div>
                    <div className="space-y-3">
                        {data?.missingSkills?.length > 0 ? (
                            data.missingSkills.map((skill, index) => (
                                <div key={index} className="group p-4 bg-slate-950/40 border border-slate-800 hover:border-red-500/30 rounded-2xl transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-red-400 transition-colors">
                                           <Target size={18} />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm tracking-tight">{skill._id}</p>
                                            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">Market Demand Gap</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-400 font-black text-sm">{skill.count}</p>
                                        <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">Jobs Impacted</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-10 italic">Your skill-set is perfectly balanced with current market demands.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
