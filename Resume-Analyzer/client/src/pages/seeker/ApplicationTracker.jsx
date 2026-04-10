import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Briefcase, 
    Calendar, 
    Building2, 
    Loader2,
    Kanban,
    Mail,
    GripVertical,
    Trash2,
    Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

const COLUMNS = [
    { id: 'applied',   title: 'Applied',   color: 'border-blue-500/20 text-blue-400' },
    { id: 'screening', title: 'Screening', color: 'border-cyan-500/20 text-cyan-400' },
    { id: 'interview', title: 'Interview', color: 'border-purple-500/20 text-purple-400' },
    { id: 'offer',     title: 'Offer',     color: 'border-emerald-500/20 text-emerald-400' },
    { id: 'rejected',  title: 'Rejected',  color: 'border-slate-800 text-slate-500' }
];

export default function ApplicationTracker() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const { data } = await API.get('/api/applications/my-applications');
            setApplications(data.data || []);
        } catch (err) {
            setError('Failed to load tracked applications.');
        } finally {
            setLoading(false);
        }
    };

    const columnsData = COLUMNS.reduce((acc, col) => {
        acc[col.id] = applications.filter(app => {
            const status = app.status?.toLowerCase();
            return (status === col.id || (col.id === 'rejected' && status === 'withdrawn'));
        });
        return acc;
    }, {});

    const handleWithdraw = async (id) => {
        if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
        try {
            await API.patch(`/api/applications/${id}/withdraw`);
            toast.success('Application withdrawn successfully');
            fetchApplications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to withdraw application');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
            <p className="text-slate-400 font-medium">Loading your pipeline...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-10">
            <header className="mb-10 flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Kanban size={18} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Application Tracking System</span>
                    </div>
                    <h1 className="text-3xl font-black text-white">Your Career Pipeline</h1>
                    <p className="text-slate-500">Visualizing {applications.length} active opportunities.</p>
                </div>
            </header>

            <DragDropContext onDragEnd={() => {}}>
                <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
                    {COLUMNS.map(column => (
                        <div key={column.id} className="min-w-[300px] w-[320px] shrink-0">
                            <div className={`p-4 mb-5 rounded-2xl border bg-slate-900/40 flex items-center justify-between ${column.color}`}>
                                <h3 className="font-bold uppercase tracking-widest text-[11px]">{column.title}</h3>
                                <span className="text-[10px] font-black bg-slate-800 px-2.5 py-1 rounded-full border border-white/5">
                                    {columnsData[column.id]?.length || 0}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 min-h-[600px]">
                                        {columnsData[column.id]?.map((app, index) => (
                                            <Draggable key={app._id} draggableId={app._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl transition-all duration-300
                                                            ${snapshot.isDragging ? 'rotate-2 scale-105 z-50 border-cyan-500/50 ring-4 ring-cyan-500/10' : 'hover:border-slate-600'}`}
                                                    >
                                                        <div className="flex justify-end mb-2 -mt-2 -mr-2">
                                                            <div {...provided.dragHandleProps} className="p-1 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing">
                                                                <GripVertical size={16} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                                                                    {app.jobId?.companyLogo 
                                                                        ? <img src={app.jobId.companyLogo} className="w-full h-full object-cover rounded-lg" /> 
                                                                        : <Building2 size={16} className="text-slate-600" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-white font-black text-sm truncate leading-tight tracking-tight">
                                                                        {app.jobId?.title || <span className="text-slate-500 italic">Job Removed</span>}
                                                                    </h4>
                                                                    <p className="text-cyan-500 text-[10px] font-black uppercase tracking-wider truncate mt-0.5">
                                                                        {app.jobId?.company || '—'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div {...provided.dragHandleProps} className="p-1 text-slate-800 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                                                <GripVertical size={16} />
                                                            </div>
                                                        </div>

                                                        {app.jobId?.postedBy && (
                                                            <div className="flex items-center justify-between mb-4 py-2 border-y border-white/5 bg-slate-900/40 px-2 rounded-lg">
                                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Recruiter</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-300 text-[10px] font-bold">{app.jobId.postedBy.name}</span>
                                                                    <button 
                                                                        onClick={() => window.location.href = `mailto:${app.jobId.postedBy.email}?subject=Inquiry: ${app.jobId.title}`}
                                                                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                                                                    >
                                                                        <Mail size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                                             <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                                                                <Calendar size={11} /> {new Date(app.appliedAt).toLocaleDateString()}
                                                             </div>
                                                             <div className="flex items-center gap-2">
                                                                 {app.status !== 'withdrawn' && app.status !== 'rejected' && (
                                                                     <button onClick={() => handleWithdraw(app._id)} className="p-1.5 text-slate-600 hover:text-red-500">
                                                                        <Trash2 size={13} />
                                                                     </button>
                                                                 )}
                                                                 <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                                                     app.status === 'screening'  ? 'bg-cyan-500/20 text-cyan-400' :
                                                                     app.status === 'interview'  ? 'bg-purple-500/20 text-purple-400' :
                                                                     app.status === 'offer'      ? 'bg-emerald-500/20 text-emerald-400' :
                                                                     app.status === 'rejected'   ? 'bg-red-500/20 text-red-400' :
                                                                     app.status === 'withdrawn'  ? 'bg-slate-700 text-slate-400' :
                                                                     'bg-blue-500/20 text-blue-400'
                                                                 }`}>
                                                                     {app.status === 'screening' ? '🔵 Shortlisted' :
                                                                      app.status === 'interview' ? '🟣 Interview' :
                                                                      app.status === 'offer'     ? '🟢 Offer!' :
                                                                      app.status === 'rejected'  ? '❌ Rejected' :
                                                                      app.status === 'withdrawn' ? '↩ Withdrawn' :
                                                                      '⏳ Applied'}
                                                                 </div>
                                                             </div>
                                                        </div>

                                                        {/* Recruiter Feedback Section */}
                                                        {app.notes && (
                                                            <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                                                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                     <Bell size={10} /> Recruiter Feedback
                                                                </p>
                                                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                                                    "{app.notes}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
