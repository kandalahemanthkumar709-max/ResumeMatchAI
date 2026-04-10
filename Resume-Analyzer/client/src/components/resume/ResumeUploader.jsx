import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { uploadResume } from '../../api/resume.api';

/**
 * ResumeUploader — Drag-and-drop file upload component
 *
 * HOW REACT-DROPZONE WORKS:
 * useDropzone gives you event handlers (onDrop, onClick, etc.) and state
 * that you spread onto a <div>. When a user drops a file on that div,
 * or clicks it and selects a file, onDrop fires with an array of accepted files.
 *
 * We validate file type BOTH here (frontend) AND on the server (multer).
 * Frontend validation = instant feedback. Server validation = real security.
 *
 * Props:
 *   onSuccess (Function) - Called with the new resume data after successful upload
 */
export function ResumeUploader({ onSuccess }) {
    const [file, setFile]             = useState(null);       // Selected File object
    const [label, setLabel]           = useState('');         // Custom label input
    const [progress, setProgress]     = useState(0);          // Upload % (0-100)
    const [uploading, setUploading]   = useState(false);      // Is upload in progress?
    const [uploaded, setUploaded]     = useState(false);      // Did it succeed?
    const [error, setError]           = useState(null);       // Error message string

    /**
     * onDrop — called by react-dropzone when user drops/selects a file.
     *
     * acceptedFiles = files that passed our accept filter
     * rejectedFiles = files that failed (wrong type, too big, etc.)
     *
     * useCallback ensures this function reference stays stable between renders
     * (avoids dropzone re-initialising on every render)
     */
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        // Reset all previous state
        setError(null);
        setUploaded(false);
        setProgress(0);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError('File is too large. Maximum size is 5MB.');
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                setError('Only PDF and DOCX files are accepted.');
            } else {
                setError('File rejected: ' + rejection.errors[0]?.message);
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
            // Pre-fill label with filename (without extension)
            setLabel(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
    }, []);

    /**
     * useDropzone configuration:
     *   accept  → MIME types we allow (matches our server-side fileFilter)
     *   maxSize → 5MB in bytes
     *   multiple → only one file at a time
     */
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        multiple: false,
    });

    // Format file size for display: turns 204800 → "200 KB"
    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            // uploadResume sends a FormData request with progress tracking
            const result = await uploadResume(file, label, (pct) => setProgress(pct));
            setUploaded(true);
            setProgress(100);

            // Notify the parent (Resumes page) that a new resume was added
            if (onSuccess) onSuccess(result.data);
        } catch (err) {
            // err.response?.data?.message comes from our Express error handler JSON
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetUploader = () => {
        setFile(null);
        setLabel('');
        setProgress(0);
        setUploaded(false);
        setError(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto">

            {/* ── Drop Zone ───────────────────────────────────────────── */}
            {/* getRootProps() spreads onClick, onDrop, aria attributes etc. */}
            {/* getInputProps() gives the hidden <input type="file"> its props */}
            {!file && (
                <div
                    {...getRootProps()}
                    className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
                        ${isDragActive
                            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]'
                            : 'border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
                        }`}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                            ${isDragActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Upload size={32} />
                        </div>

                        {isDragActive ? (
                            <p className="text-cyan-400 font-semibold text-lg">Drop it here!</p>
                        ) : (
                            <>
                                <p className="text-white font-semibold text-lg">
                                    Drag & drop your resume here
                                </p>
                                <p className="text-slate-400 text-sm">
                                    or <span className="text-cyan-400 underline">click to browse</span>
                                </p>
                                <p className="text-slate-600 text-xs mt-2">
                                    PDF or DOCX • Max 5MB
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── File Selected State ──────────────────────────────────── */}
            <AnimatePresence>
                {file && !uploaded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* File info card */}
                        <div className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-700 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                                <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{file.name}</p>
                                <p className="text-slate-400 text-sm">{formatSize(file.size)}</p>
                            </div>
                            <button onClick={resetUploader} className="text-slate-500 hover:text-red-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Label input */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Resume Label (optional)</label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Senior Dev Resume, Marketing CV"
                                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        {/* Progress bar (only shown while uploading) */}
                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Uploading & Analyzing...</span>
                                    <span className="text-cyan-400 font-mono">{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        {/* Upload button */}
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl
                                       hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <><Loader2 size={20} className="animate-spin" /> Analyzing Resume...</>
                            ) : (
                                <><Upload size={20} /> Upload & Analyze</>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Success State ────────────────────────────────────────── */}
            <AnimatePresence>
                {uploaded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4 p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <CheckCircle size={36} />
                        </div>
                        <div>
                            <p className="text-emerald-400 font-bold text-lg">Analysis Complete!</p>
                            <p className="text-slate-400 text-sm mt-1">Your resume has been uploaded and analyzed by AI.</p>
                        </div>
                        <button
                            onClick={resetUploader}
                            className="px-6 py-2 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm"
                        >
                            Upload Another
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
