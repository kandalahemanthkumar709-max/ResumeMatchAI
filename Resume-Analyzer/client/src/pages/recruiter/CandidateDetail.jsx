import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Mail, 
    FileText, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Loader2, 
    MessageSquare, 
    Download,
    Zap,
    LogIn
} from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../../services/api';
import { StatusTimeline } from '../../components/applications/StatusTimeline';

/**
 * RECRUITER: CANDIDATE DETAIL
 * 
 * Allows recruiter to review a specific applicant.
 * Features: Resume view, Status update, Internal notes.
 */
export function CandidateDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);
    
    // Status update state
    const [newStatus, setNewStatus] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const { data } = await API.get(`/api/applications/${id}`);
                setApplication(data.data);
                setNewStatus(data.data.status);
            } catch (err) {
                setError('Application not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleStatusUpdate = async () => {
        setUpdating(true);
        try {
            await API.patch(`/api/applications/${id}/status`, { status: newStatus, notes: note });
            alert('Status updated successfully!');
            setNote(''); // Clear the text box after success
            // Refresh detail
            const { data } = await API.get(`/api/applications/${id}`);
            setApplication(data.data);
        } catch (err) {
            alert('Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" /></div>;

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            {/* Nav */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-10">
                <ArrowLeft size={18} /> Back to Applicants
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Left: Candidate Info & Resume (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Header */}
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
                                {application.seekerId?.name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white leading-tight">{application.seekerId?.name}</h1>
                                <p className="text-slate-500 text-sm">{application.seekerId?.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a 
                                href={`mailto:${application.seekerId?.email}`}
                                className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                                title="Email Candidate"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Cover Letter */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Message to Recruiter</h3>
                        <div className="p-8 bg-slate-900/40 border border-slate-800 border-dashed rounded-[2rem] text-slate-300 leading-relaxed italic">
                            "{application.coverLetter || 'No message provided by candidate.'}"
                        </div>
                    </section>
                </div>

                {/* Right: Status Management (1/3) */}
                <div className="space-y-8">
                    
                        {/* Management Card */}
                        <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-8 relative overflow-hidden group">
                            {/* Privacy Shield Accent */}
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <Zap size={140} className="text-purple-500" />
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">Pipeline Status</h3>
                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase rounded leading-none">Action Required</span>
                                </div>
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full p-5 bg-slate-950 border border-slate-800 rounded-3xl text-white font-black text-sm focus:border-purple-500 outline-none transition-all shadow-inner"
                                >
                                    <option value="applied">Initial Applied</option>
                                    <option value="screening">Phone Screening</option>
                                    <option value="interview">On-Site Interview</option>
                                    <option value="offer">Grant Offer</option>
                                    <option value="rejected">Not a Fit</option>
                                </select>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">Internal evaluation</h3>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded leading-none">
                                        <LogIn size={10} /> Recruiter Only
                                    </div>
                                </div>
                                <div className="relative group/note">
                                    <textarea 
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={5}
                                        placeholder="Enter private recruiter feedback here..."
                                        className="w-full p-5 bg-slate-950/50 border border-slate-800/80 rounded-[2rem] text-slate-300 text-sm focus:border-amber-500/50 outline-none transition-all resize-none placeholder:text-slate-700 font-medium"
                                    />
                                    {/* Evaluation Quality Tip */}
                                    <div className="absolute bottom-4 right-4 text-[9px] font-black text-slate-700 uppercase tracking-tighter opacity-0 group-focus-within/note:opacity-100 transition-opacity">
                                        Privacy mode active
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleStatusUpdate}
                                disabled={updating}
                                className="w-full py-5 bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-sm rounded-[2rem] shadow-2xl hover:bg-purple-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {updating ? <Loader2 size={20} className="animate-spin" /> : <>Commit Change <ChevronRight size={18} /></>}
                            </button>
                        </div>

                    {/* Small Status History */}
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1 mb-8">Process Audit Trail</h3>
                        <StatusTimeline history={application.statusHistory} />
                    </div>
                </div>

            </div>
        </div>
    );
}
