import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Trash2, Star, StarOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllResumes, deleteResume, setDefaultResume, reanalyzeResume } from '../../api/resume.api';
import { ResumeUploader } from '../../components/resume/ResumeUploader';
import { ResumeViewerModal } from '../../components/resume/ResumeViewerModal';

/**
 * Resumes Page — Shows all uploaded resumes + upload functionality
 *
 * State management:
 *   resumes     → the list fetched from server
 *   loading     → true while fetching
 *   error       → any fetch error
 *   showUpload  → toggle the uploader panel
 *   deleting    → tracks which resume ID is being deleted (to show spinner on card)
 */
export function Resumes() {
    const [resumes, setResumes]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [deleting, setDeleting]     = useState(null); // resume._id being deleted
    const [analyzing, setAnalyzing]   = useState(null); // resume._id being re-analyzed
    const [viewingResumeId, setViewingResumeId] = useState(null);

    // Fetch resumes when the page first mounts
    useEffect(() => {
        fetchResumes();
    }, []); // [] = run once on mount, not on every re-render

    const fetchResumes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllResumes();
            setResumes(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load resumes.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * handleUploadSuccess — Called by ResumeUploader when an upload completes.
     * Prepends the new resume to the list (no need to re-fetch from server).
     */
    const handleUploadSuccess = (newResume) => {
        setResumes(prev => [newResume, ...prev]);
        setShowUpload(false); // hide uploader after successful upload
    };

    /**
     * handleDelete — Deletes a resume after user confirms.
     * Uses window.confirm for simplicity; replace with a modal in production.
     */
    const handleDelete = async (resumeId, fileName) => {
        if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

        setDeleting(resumeId);
        try {
            await deleteResume(resumeId);
            // Remove from local state immediately — no need to refetch
            setResumes(prev => prev.filter(r => r._id !== resumeId));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.');
        } finally {
            setDeleting(null);
        }
    };

    /**
     * handleSetDefault — Marks a resume as the default and updates local state.
     */
    const handleSetDefault = async (resumeId) => {
        try {
            await setDefaultResume(resumeId);
            // Update local state: set chosen as default, un-default the rest
            setResumes(prev => prev.map(r => ({
                ...r,
                isDefault: r._id === resumeId,
            })));
        } catch (err) {
            alert(err.response?.data?.message || 'Could not set default.');
        }
    };

    /**
     * handleRetryAnalysis — Manually triggers AI analysis for a failed resume.
     */
    const handleRetryAnalysis = async (resumeId) => {
        setAnalyzing(resumeId);
        try {
            const data = await reanalyzeResume(resumeId);
            // Replace the resume object in local state with the newly analyzed one
            setResumes(prev => prev.map(r => r._id === resumeId ? data.data : r));
        } catch (err) {
            alert(err.response?.data?.message || 'Re-analysis failed.');
        } finally {
            setAnalyzing(null);
        }
    };

    // ATS score colour coding
    const getScoreColor = (score) => {
        if (score === null || score === undefined) return 'text-slate-500';
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score) => {
        if (score === null || score === undefined) return 'bg-slate-800';
        if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
        if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Resumes</h1>
                    <p className="text-slate-400 mt-1">Upload, manage, and track your resume versions.</p>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600
                               text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500
                               transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Plus size={18} />
                    {showUpload ? 'Cancel' : 'Upload Resume'}
                </button>
            </div>

            {/* ── Upload Panel (slide in/out) ──────────────────────────── */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-10"
                    >
                        <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
                            <h2 className="text-lg font-bold text-white mb-6">Upload New Resume</h2>
                            <ResumeUploader onSuccess={handleUploadSuccess} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Loading State ────────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-cyan-400" size={40} />
                </div>
            )}

            {/* ── Error State ──────────────────────────────────────────── */}
            {error && !loading && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 mb-6">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                    <button onClick={fetchResumes} className="ml-auto underline text-sm">Retry</button>
                </div>
            )}

            {/* ── Empty State ──────────────────────────────────────────── */}
            {!loading && !error && resumes.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center mb-6">
                        <FileText size={40} className="text-slate-600" />
                    </div>
                    <p className="text-slate-300 font-semibold text-lg">No resumes yet</p>
                    <p className="text-slate-500 text-sm mt-2">Upload your first resume to get started.</p>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="mt-6 px-6 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-colors"
                    >
                        Upload Your First Resume
                    </button>
                </motion.div>
            )}

            {/* ── Resume Cards Grid ────────────────────────────────────── */}
            {!loading && resumes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resumes.map((resume, i) => (
                        <motion.div
                            key={resume._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`group relative p-6 rounded-3xl bg-slate-900/40 border transition-all duration-300
                                ${resume.isDefault ? 'border-cyan-500/40' : 'border-slate-800 hover:border-slate-700'}`}
                        >
                            {/* Default badge */}
                            {resume.isDefault && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/30">
                                    <Star size={10} fill="currentColor" />
                                    DEFAULT
                                </div>
                            )}

                            {/* File icon + name */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
                                    <FileText size={22} className="text-cyan-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white font-semibold truncate pr-16">{resume.label}</p>
                                    <p className="text-slate-500 text-sm truncate">{resume.originalName}</p>
                                    <p className="text-slate-600 text-xs mt-1">
                                        {new Date(resume.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* ATS Score + Status */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold ${getScoreBg(resume.atsScore)}`}>
                                    <span className={getScoreColor(resume.atsScore)}>
                                        {resume.atsScore !== null ? `ATS ${resume.atsScore}%` : 'Not scored'}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                                    ${resume.status === 'parsed' ? 'text-emerald-400 bg-emerald-500/10' :
                                      resume.status === 'failed' ? 'text-red-400 bg-red-500/10' :
                                      'text-yellow-400 bg-yellow-500/10'}`}>
                                    {resume.status === 'parsed' && <CheckCircle size={12} />}
                                    {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
                                </div>

                                {resume.status === 'failed' && (
                                    <button
                                        onClick={() => handleRetryAnalysis(resume._id)}
                                        disabled={analyzing === resume._id}
                                        className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/20"
                                    >
                                        {analyzing === resume._id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                                        RETRY
                                    </button>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                                {/* Set as Default */}
                                {!resume.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(resume._id)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 border border-slate-700
                                                   rounded-xl hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                                    >
                                        <StarOff size={12} /> Set Default
                                    </button>
                                )}

                                {/* View file */}
                                <button
                                    onClick={() => setViewingResumeId(resume._id)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 border border-slate-700
                                               rounded-xl hover:text-white hover:border-slate-600 transition-all font-medium"
                                >
                                    <FileText size={12} /> View Details
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(resume._id, resume.label)}
                                    disabled={deleting === resume._id}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 border border-transparent
                                               rounded-xl hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                                >
                                    {deleting === resume._id
                                        ? <Loader2 size={12} className="animate-spin" />
                                        : <Trash2 size={12} />
                                    }
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Resume Viewer Modal */}
            <ResumeViewerModal 
                resumeId={viewingResumeId} 
                onClose={() => setViewingResumeId(null)} 
            />
        </div>
    );
}
