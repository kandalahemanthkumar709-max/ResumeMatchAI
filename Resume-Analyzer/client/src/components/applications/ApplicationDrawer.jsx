import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Building2, MapPin, Calendar, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { StatusTimeline } from './StatusTimeline';

/**
 * APPLICATION DETAIL DRAWER
 * 
 * Slides in from the right to show full details of a submitted application.
 */
export function ApplicationDrawer({ application, onClose }) {
    if (!application) return null;

    const { jobId, status, statusHistory, appliedAt, coverLetter } = application;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />

                {/* Drawer */}
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-bold text-white">Application Details</h2>
                            <p className="text-slate-500 text-xs">Applied on {new Date(appliedAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        
                        {/* 1. Job Quick Info */}
                        <section className="p-6 bg-slate-950/40 border border-slate-800 rounded-3xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                    {jobId?.companyLogo ? <img src={jobId.companyLogo} className="w-full h-full object-cover" /> : <Building2 size={24} className="text-slate-500" />}
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-bold text-white leading-tight">{jobId?.title}</h3>
                                    <p className="text-slate-500 text-sm">{jobId?.company}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <span className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin size={14} /> {jobId?.location}</span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-400"><Briefcase size={14} /> {jobId?.jobType}</span>
                            </div>
                        </section>

                        {/* 2. Status Progress */}
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Progress Timeline</h4>
                            <StatusTimeline history={statusHistory} />
                        </section>

                        {/* 3. Cover Letter (If any) */}
                        {coverLetter && (
                            <section className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Your Message</h4>
                                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-sm leading-relaxed italic border-dashed">
                                    "{coverLetter}"
                                </div>
                            </section>
                        )}
                        
                        {/* 4. Actions */}
                        <section className="pt-6 space-y-3">
                            <button className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all">
                                Withdraw Application
                            </button>
                            <p className="text-[10px] text-slate-600 text-center italic px-10 leading-relaxed uppercase tracking-widest font-bold">
                                Withdrawing is permanent. You won't be able to re-apply for this specific job.
                            </p>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-950/40 border-t border-slate-800">
                        <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            View Original Job Post <ExternalLink size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
