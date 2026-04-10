import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Users, 
    ArrowLeft, 
    Loader2, 
    Filter, 
    Download, 
    MessageSquare, 
    UserPlus, 
    Search,
    ChevronRight,
    Briefcase,
    Calendar,
    Settings2,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { MatchScoreRing } from '../../components/jobs/MatchScoreRing';
import { MatchDetailModal } from '../../components/jobs/MatchDetailModal';

/**
 * Candidate Ranking Page (Recruiter)
 * 
 * Shows all potential candidates for a specific job, ranked by match score.
 */
export function Candidates() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [minFilter, setMinFilter] = useState(0);
    const [selectedMatch, setSelectedMatch] = useState(null);

    useEffect(() => {
        const fetchCandidates = async () => {
            setLoading(true);
            try {
                // Fetch job details, matches, and actual applications in parallel
                const [jobRes, matchRes, appRes] = await Promise.all([
                    API.get(`/api/jobs/${jobId}`),
                    API.get(`/api/matches/for-job/${jobId}`).catch(() => ({ data: { data: [] } })),
                    API.get(`/api/applications/job/${jobId}`)
                ]);
                
                setJob(jobRes.data.data);
                
                const applications = appRes.data.data || [];
                const aiMatches = matchRes.data.data || [];

                // Build candidate list from APPLICATIONS first (so all applicants appear)
                // Then enrich with AI match data if available
                const merged = applications.map(app => {
                    const aiMatch = aiMatches.find(
                        m => m.seekerId?.toString() === app.seekerId?._id?.toString()
                    );
                    return {
                        // AI match fields (with fallbacks)
                        _id:           aiMatch?._id || app._id,
                        seekerId:      app.seekerId?._id,
                        overallScore:  aiMatch?.overallScore ?? 0,
                        matchedSkills: aiMatch?.matchedSkills || [],
                        missingSkills: aiMatch?.missingSkills || [],
                        partialSkills: aiMatch?.partialSkills || [],
                        reasoning:     aiMatch?.reasoning || 'No detailed analysis generated.',
                        breakdown:     aiMatch?.breakdown || { skillScore: 0, experienceScore: 0, educationScore: 0, locationScore: 0 },
                        resume: {
                            label: app.resumeId?.label || 'Resume',
                            ...(aiMatch?.resume || {})
                        },
                        // Application fields
                        applicationId: app._id,
                        status:        app.status,
                        seekerName:    app.seekerId?.name || 'Applicant',
                        appliedAt:     app.appliedAt,
                        coverLetter:   app.coverLetter,
                    };
                });

                setCandidates(merged);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load candidates.');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [jobId]);

    const [shortlistingId, setShortlistingId] = useState('');

    const handleShortlist = async (appId) => {
        if (!appId) {
            alert("This candidate has not applied yet. You can only shortlist applicants.");
            return;
        }

        setShortlistingId(appId);
        try {
            await API.patch(`/api/applications/${appId}/status`, { status: 'screening' });
            // Update local state
            setCandidates(prev => prev.map(c => 
                c.applicationId === appId ? { ...c, status: 'screening' } : c
            ));
        } catch (err) {
            alert('Failed to shortlist candidate.');
        } finally {
            setShortlistingId(null);
        }
    };

    const filteredCandidates = candidates.filter(c => c.overallScore >= minFilter);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ranking Candidates...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/recruiter/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 px-4 rounded-xl">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Job Active</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-medium">
                    {error}
                </div>
            )}

            {/* Job Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-slate-800/50">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <Users size={18} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Candidate Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-white">{job?.title}</h1>
                    <p className="text-slate-500 flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job?.jobType}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Posted {new Date(job?.createdAt).toLocaleDateString()}</span>
                    </p>
                </div>

                {/* Quick Stats & Filters */}
                <div className="flex items-center gap-3">
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Total Pooled</p>
                            <p className="text-2xl font-black text-white">{candidates.length}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-800" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase">Min Match Filter</p>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range" min="0" max="100" 
                                    value={minFilter} onChange={(e) => setMinFilter(Number(e.target.value))}
                                    className="w-24 accent-purple-500 h-1 rounded-full bg-slate-800 cursor-pointer"
                                />
                                <span className="text-white font-black text-sm">{minFilter}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Candidates List */}
            <div className="space-y-6">
                {filteredCandidates.length === 0 ? (
                    <div className="p-20 text-center bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem]">
                        <p className="text-slate-500 font-bold italic">No candidates meet the {minFilter}% match threshold.</p>
                    </div>
                ) : (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-800/50 bg-slate-950/20">
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate Profile</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Score</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Skills Matched</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCandidates.map((c, i) => (
                                    <motion.tr 
                                        key={c._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="border-b border-slate-800/30 hover:bg-slate-800/10 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedMatch(c)}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black">
                                                    {(c.seekerName || c.resume?.label || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold group-hover:text-purple-400 transition-colors">{c.seekerName || 'Applicant'}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">{c.resume?.label || 'Resume'}{c.overallScore > 0 ? '' : ' · Awaiting AI Score'}</p>
                                                        {c.coverLetter && (
                                                            <span className="flex items-center gap-1 text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wide">
                                                                <FileText size={8} /> Cover Letter
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-center">
                                                <MatchScoreRing score={c.overallScore} size={50} strokeWidth={4} />
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                {c.matchedSkills.slice(0, 4).map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-bold border border-slate-700">
                                                        {s}
                                                    </span>
                                                ))}
                                                {c.matchedSkills.length > 4 && (
                                                    <span className="text-[10px] text-slate-600 font-bold">+{c.matchedSkills.length - 4}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedMatch(c); }}
                                                    className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white hover:bg-slate-700 transition-all"
                                                    title="Detailed AI Analysis"
                                                >
                                                    <Settings2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleShortlist(c.applicationId); }}
                                                    disabled={shortlistingId !== '' && shortlistingId === c.applicationId || c.status === 'screening'}
                                                    className={`px-4 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                                                        c.status === 'screening' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                                                        : 'bg-purple-500 text-white hover:bg-purple-400 shadow-purple-500/20 active:scale-95'
                                                    }`}
                                                >
                                                    {shortlistingId !== '' && shortlistingId === c.applicationId ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : c.status === 'screening' ? (
                                                        'Shortlisted ✓'
                                                    ) : (
                                                        'Shortlist'
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Match Detail Modal for Recruiter */}
            <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
        </div>
    );
}
