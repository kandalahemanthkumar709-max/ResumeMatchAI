import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../../services/api';

export function ResumeViewerModal({ resumeId, onClose }) {
    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!resumeId) return;

        const fetchResume = async () => {
            setLoading(true);
            try {
                const { data } = await API.get(`/api/resumes/${resumeId}`);
                setResumeData(data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load resume details.');
            } finally {
                setLoading(false);
            }
        };

        fetchResume();
    }, [resumeId]);

    if (!resumeId) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <FileText className="text-cyan-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">
                                    {resumeData ? resumeData.label : 'Loading...'}
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    {resumeData ? resumeData.originalName : ''}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-cyan-400">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
                                <p>Load Resume Parsing Data...</p>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                                <AlertCircle size={20} />
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !error && resumeData && (
                            <div className="space-y-8">
                                {/* ATS INFO */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                                        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">ATS Score</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">{resumeData.atsScore || 0}</span>
                                            <span className="text-slate-500 font-medium">/ 100</span>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                                        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Status</h3>
                                        <div className="text-lg font-medium text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 size={20} /> {resumeData.status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {/* Raw Text Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Extracted Document Text</h3>
                                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 h-64 overflow-y-auto text-slate-400 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                        {resumeData.rawText || "No text could be extracted."}
                                    </div>
                                </div>
                                
                                {/* AI Parsed Issues/Weaknesses */}
                                {resumeData.atsIssues && resumeData.atsIssues.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle size={16} /> Suggestions for Improvement
                                        </h3>
                                        <div className="space-y-2">
                                            {resumeData.atsIssues.map((issue, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                                    <XCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-slate-300 text-sm">{issue}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
