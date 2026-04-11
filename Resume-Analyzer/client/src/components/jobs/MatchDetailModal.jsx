import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, XCircle, Zap, FileText, ArrowRight, ExternalLink, Loader2, Download, Copy, Mail } from 'lucide-react';
import { MatchScoreRing } from './MatchScoreRing';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

/**
 * MatchDetailModal
 * 
 * Shows:
 * 1. AI Reasoning (3 sentences)
 * 2. Score Breakdown (Bar Chart)
 * 3. Skills Analysis (Matched/Missing/Partial)
 */
export function MatchDetailModal({ match, onClose, onApply, isApplying }) {
    const [generatedLetter, setGeneratedLetter] = useState(match?.coverLetter || '');
    const [letterLoading, setLetterLoading] = useState(false);

    if (!match) return null;

    const handleGenerateLetter = async () => {
        setLetterLoading(true);
        try {
            const { data } = await API.post('/api/matches/cover-letter', {
                resumeId: match.resumeId,
                jobId: match.jobId || match.job?._id
            });
            setGeneratedLetter(data.data);
            toast.success('Cover letter generated!');
        } catch (err) {
            toast.error('Failed to generate cover letter.');
        } finally {
            setLetterLoading(false);
        }
    };

    const { breakdown, matchedSkills = [], missingSkills = [], partialSkills = [], reasoning, overallScore, job } = match;

    // FAIL-SAFE: If structuredData is missing, derive requirements from the match result itself
    const allRequirements = job?.structuredData?.required_skills || [
        ...matchedSkills,
        ...missingSkills,
        ...partialSkills
    ];

    const categories = [
        { label: 'Skills',      value: breakdown.skillScore,      color: 'bg-emerald-500' },
        { label: 'Experience',  value: breakdown.experienceScore, color: 'bg-blue-500' },
        { label: 'Education',   value: breakdown.educationScore,  color: 'bg-purple-500' },
        { label: 'Location',    value: breakdown.locationScore,   color: 'bg-amber-500' },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <MatchScoreRing score={overallScore} size={50} strokeWidth={4} />
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">{job?.title}</h2>
                                <p className="text-slate-500 text-sm">{job?.company} • Match Analysis</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                        
                        {/* 1. AI Reasoning Section */}
                        <section className="p-6 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl relative">
                            <div className="absolute top-4 right-4 text-indigo-400">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">AI Match Insight</h3>
                            <p className="text-slate-300 leading-relaxed italic">
                                "{reasoning}"
                            </p>
                        </section>

                        {/* Letter Display Section (Dynamic) */}
                        {generatedLetter && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Tailored Cover Letter</h3>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedLetter);
                                            toast.success('Copied to clipboard!');
                                        }}
                                        className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <Copy size={12} /> Copy
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const subject = encodeURIComponent(`Application for ${job.title} - ${job.company}`);
                                            const body = encodeURIComponent(generatedLetter);
                                            window.location.href = `mailto:${job.postedBy?.email || ''}?subject=${subject}&body=${body}`;
                                        }}
                                        className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                                    >
                                        <Mail size={12} /> Email Recruiter
                                    </button>
                                </div>
                                <div className="p-6 bg-slate-950 border border-cyan-500/20 rounded-2xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <FileText size={80} className="text-cyan-500" />
                                     </div>
                                     <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                                        {generatedLetter}
                                     </p>
                                </div>
                            </section>
                        )}

                        {/* 1b. Recruiter Requirements (New) */}
                        {job?.requirements && (
                            <section className="space-y-3">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Recruiter Requirements
                                </h3>
                                <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl">
                                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                        {job.requirements}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* 2. Score Breakdown Bar Chart */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Score Breakdown</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categories.map(cat => (
                                    <div key={cat.label} className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">{cat.label}</span>
                                            <span className="text-white font-bold">{cat.value}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.value}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className={`h-full ${cat.color}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Skills Analysis */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">AI Skills Analysis</h3>
                                <div className="text-[10px] text-slate-500 px-2 py-0.5 bg-slate-800 rounded">
                                    {allRequirements.length} Total Requirements
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Matched */}
                                {matchedSkills.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                                            <CheckCircle2 size={12} /> Matched Skills
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {matchedSkills.map(s => (
                                                <span key={s} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Partial */}
                                {partialSkills.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1.5">
                                            <AlertCircle size={12} /> Partial Matches
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {partialSkills.map(s => (
                                                <span key={s} className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Missing */}
                                {missingSkills.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1.5">
                                            <XCircle size={12} /> Missing Requirements
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {missingSkills.map(s => (
                                                <div key={s} className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium group">
                                                    {s}
                                                    <a href={`https://www.youtube.com/results?search_query=learn+${s}`} target="_blank" rel="noreferrer" className="text-[10px] bg-red-500/20 px-1 rounded hover:bg-red-500/40 transition-colors">
                                                        Learn
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-slate-950/40 border-t border-slate-800 flex items-center gap-3">
                        {onApply ? (
                            <>
                                <button 
                                    onClick={handleGenerateLetter}
                                    disabled={letterLoading}
                                    className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {letterLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                                    {generatedLetter ? 'Regenerate Draft' : 'Generate Cover Letter'}
                                </button>
                                <button 
                                    onClick={() => onApply(generatedLetter)}
                                    disabled={isApplying}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isApplying ? (
                                        <><Loader2 className="animate-spin" size={18} /> Applying...</>
                                    ) : (
                                        <>Apply Now <ArrowRight size={18} /></>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => window.location.href = `/recruiter/applications/${match.applicationId}`}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                                >
                                    Manage Candidate <ArrowRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
