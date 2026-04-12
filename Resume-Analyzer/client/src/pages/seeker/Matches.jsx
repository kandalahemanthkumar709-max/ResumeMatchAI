import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Filter, ChevronRight, Loader2, FileText, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import API from '../../services/api';
import { MatchScoreRing } from '../../components/jobs/MatchScoreRing';
import { MatchDetailModal } from '../../components/jobs/MatchDetailModal';

/**
 * Job Matches Page (Seeker)
 * 
 * Fetches and displays top job matches for the user's default resume.
 */
export function Matches() {
    const [resumes, setResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [minMatch, setMinMatch] = useState(60);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isApplying, setIsApplying] = useState(false);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());

    useEffect(() => {
        API.get('/api/applications/my-applications').then(({ data }) => {
            const ids = new Set((data.data || []).map(app => (app.jobId?._id || app.jobId)));
            setAppliedJobIds(ids);
        }).catch(() => {});
    }, []);

    const handleApply = async (coverLetter = '') => {
        if (!selectedMatch) return;
        
        setIsApplying(true);
        try {
            await API.post('/api/applications', {
                jobId: selectedMatch.job._id,
                resumeId: selectedMatch.resumeId || selectedResumeId,
                coverLetter: coverLetter || ''
            });
            
            alert('Successfully applied to ' + selectedMatch.job.title + '!');
            setSelectedMatch(null); 
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to apply to this job.');
        } finally {
            setIsApplying(false);
        }
    };

    // 1. Fetch resumes first to let user select which one to match against
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const { data } = await API.get('/api/resumes');
                setResumes(data.data || []);
                
                // Auto-select the default resume or the first one
                const defaultResume = data.data.find(r => r.isDefault) || data.data[0];
                if (defaultResume) setSelectedResumeId(defaultResume._id);
            } catch (err) {
                console.error('MATCHES_FETCH_ERROR:', err);
                setError('Failed to load resumes. You need to upload a resume first.');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchResumes();
    }, []);

    // 2. Fetch matches whenever selected resume or min score changes
    useEffect(() => {
        if (!selectedResumeId) return;

        const fetchMatches = async () => {
            setLoading(true);
            try {
                const { data } = await API.get(`/api/matches/for-resume/${selectedResumeId}?minScore=${minMatch}`);
                setMatches(data.data || []);
            } catch (err) {
                setError('Matching failed. Please check your internet or try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [selectedResumeId, minMatch]);

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-cyan-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Initializing Match Catalyst...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            
            {/* Page Header */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Sparkles size={18} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">AI Powered Matching</span>
                    </div>
                    <h1 className="text-4xl font-black text-white">Your Top Matches</h1>
                    <p className="text-slate-500 mt-2">Personalized opportunities based on your skills and experience.</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                    <div className="space-y-1 px-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText size={10} /> Using Resume
                        </label>
                        <select 
                            value={selectedResumeId}
                            onChange={(e) => setSelectedResumeId(e.target.value)}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
                        >
                            {resumes.map(r => (
                                <option key={r._id} value={r._id} className="bg-slate-900 text-white">
                                    {r.label} {r.isDefault ? '(Default)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="space-y-1 px-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Filter size={10} /> Min Match: {minMatch}%
                        </label>
                        <input 
                            type="range" min="0" max="100" step="10"
                            value={minMatch} 
                            onChange={(e) => setMinMatch(Number(e.target.value))}
                            className="w-24 accent-cyan-400 h-1 rounded-full bg-slate-800 cursor-pointer"
                        />
                    </div>
                </div>
            </header>

            {/* Error Message */}
            {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-400 flex items-center gap-4 mb-10">
                    <AlertCircle size={24} />
                    <div>
                        <p className="font-bold">Houston, we have a problem</p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && matches.length === 0 && !error && (
                <div className="bg-slate-900/40 border border-slate-800 border-dashed p-20 rounded-[3rem] text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles size={40} className="text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">No perfect matches yet</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Try lowering your minimum match score or uploading a more detailed resume.</p>
                </div>
            )}

            {/* Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <JobMatchSkeleton key={i} />)
                ) : (
                    matches.map((m, i) => (
                        <motion.div
                            key={m._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300 cursor-pointer"
                            onClick={() => setSelectedMatch(m)}
                        >
                            {/* Match score display (top part) */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-4 bg-slate-800/80 rounded-2xl group-hover:scale-105 transition-transform duration-500">
                                    <img 
                                        src={m.job?.companyLogo || 'https://via.placeholder.com/40'} 
                                        alt={m.job?.company} 
                                        className="w-10 h-10 object-cover rounded-lg" 
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <MatchScoreRing score={m.overallScore} size={70} strokeWidth={6} />
                                    {appliedJobIds.has(m.job?._id) ? (
                                        <div className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                            <CheckCircle2 size={10} /> Applied
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compatibility</span>
                                    )}
                                </div>
                            </div>

                            {/* Job info */}
                            <div className="space-y-1 mb-8">
                                <h3 className="text-xl font-bold text-white leading-tight truncate group-hover:text-cyan-400 transition-colors">
                                    {m.job?.title}
                                </h3>
                                <p className="text-slate-400 font-medium text-sm">{m.job?.company}</p>
                                <p className="text-slate-600 text-xs flex items-center gap-1.5 uppercase tracking-widest font-bold">
                                    {m.job?.location} • {m.job?.jobType}
                                </p>
                            </div>

                            {/* AI Bite-sized summary */}
                            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 mb-8">
                                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 italic">
                                    "{m.reasoning.split('.')[0]}."
                                </p>
                            </div>

                            {/* Detailed analysis button */}
                            <button 
                                onClick={() => setSelectedMatch(m)}
                                className="w-full py-3.5 bg-slate-800 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shadow-xl"
                            >
                                <Info size={16} /> Analysis Details <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Match Detail Modal */}
            <MatchDetailModal 
                match={selectedMatch} 
                onClose={() => setSelectedMatch(null)} 
                onApply={(letter) => handleApply(letter)}
                isApplying={isApplying}
            />
        </div>
    );
}

function JobMatchSkeleton() {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 animate-pulse">
            <div className="flex justify-between mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl" />
                <div className="w-16 h-16 bg-slate-800 rounded-full" />
            </div>
            <div className="space-y-3 mb-8">
                <div className="h-5 bg-slate-800 rounded-full w-3/4" />
                <div className="h-3 bg-slate-800 rounded-full w-1/2" />
                <div className="h-2 bg-slate-800 rounded-full w-1/4" />
            </div>
            <div className="h-20 bg-slate-800 rounded-2xl mb-8" />
            <div className="h-12 bg-slate-800 rounded-2xl" />
        </div>
    );
}
