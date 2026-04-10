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
    Zap
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
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Application Status</h3>
                            <select 
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-sm focus:border-purple-500 outline-none transition-all"
                            >
                                <option value="applied">Applied</option>
                                <option value="screening">Screening</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Internal Note (Sends Email)</h3>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                placeholder="Add a note about this decision..."
                                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:border-purple-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <button 
                            onClick={handleStatusUpdate}
                            disabled={updating}
                            className="w-full py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-purple-500 transition-all disabled:opacity-40"
                        >
                            {updating ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Confirm Selection'}
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
