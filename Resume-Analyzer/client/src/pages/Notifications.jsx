import { useState, useEffect } from 'react';
import { Bell, Clock, Trash2, CheckCircle2, Navigation, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get('/api/notifications');
            setNotifications(data || []);
        } catch (err) {
            console.error('Failed to fetch');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.patch(`/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) { }
    };

    const markAllRead = async () => {
        try {
            await API.patch('/api/notifications/mark-all-read');
            fetchNotifications();
        } catch (err) { }
    };

    const deleteOne = async (id) => {
        try {
            await API.delete(`/api/notifications/${id}`);
            fetchNotifications();
        } catch (err) { }
    };

    const handleAction = async (n) => {
        await markAsRead(n._id);
        if (n.link) navigate(n.link);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
            <p className="text-slate-400 font-medium italic">Loading your activity history...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Header */}
            <header className="mb-12 flex items-end justify-between">
                <div className="space-y-2">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 text-sm font-bold">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="flex items-center gap-3 text-cyan-400 mb-2">
                        <Bell size={24} />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Notification Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-white">Recent Activity</h1>
                </div>

                {notifications.some(n => !n.isRead) && (
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/30 transition-all font-black text-xs uppercase"
                    >
                        <CheckCircle2 size={16} /> Mark All as Read
                    </button>
                )}
            </header>

            {/* List */}
            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="p-20 bg-slate-900/50 border border-slate-800 border-dashed rounded-[3rem] text-center space-y-4">
                        <Bell size={48} className="mx-auto text-slate-700 opacity-20" />
                        <p className="text-slate-500 font-medium italic">Your activity feed is empty.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((n, idx) => (
                            <motion.div
                                key={n._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`group p-6 rounded-3xl border transition-all flex items-center justify-between gap-6
                                    ${!n.isRead 
                                        ? 'bg-gradient-to-r from-slate-900 to-slate-900 border-cyan-500/20' 
                                        : 'bg-slate-950 border-slate-900 opacity-60 hover:opacity-100 hover:bg-slate-900/40'}`}
                            >
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                                        ${!n.isRead ? 'bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5' : 'bg-slate-800 text-slate-600'}`}>
                                        <Bell size={20} />
                                    </div>
                                    
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <p className={`text-lg leading-snug font-medium transition-colors ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-4 text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(n.createdAt).toLocaleString()}</span>
                                            {!n.isRead && <span className="text-cyan-500 animate-pulse">● Unread</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {n.link && (
                                        <button 
                                            onClick={() => handleAction(n)}
                                            className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-cyan-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                                        >
                                            View <Navigation size={12} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => deleteOne(n._id)}
                                        className="p-3 text-slate-700 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
