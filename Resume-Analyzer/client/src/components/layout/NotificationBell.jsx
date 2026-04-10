import { useState, useEffect } from 'react';
import { Bell, Clock, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

/**
 * NOTIFICATION BELL
 * 
 * Polls the server every 30 seconds for new alerts.
 * Features: Unread count badge, Dropdown list, Mark as read.
 */
export function NotificationBell() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get('/api/notifications');
            setNotifications(data || []);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.patch(`/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark read');
        }
    };

    const handleNotificationClick = async (n) => {
        setIsOpen(false);
        await markAsRead(n._id);
        if (n.link) navigate(n.link);
    };

    const markAllRead = async () => {
        try {
            await API.patch('/api/notifications/mark-all-read');
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all read');
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await API.delete(`/api/notifications/${id}`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to delete notification');
        }
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all border
                    ${isOpen ? 'bg-slate-800 border-slate-700 text-white' : 'hover:bg-slate-900 border-transparent text-slate-400'}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-slate-950 rounded-full text-[10px] font-black text-white flex items-center justify-center animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Invisible Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recent Activity</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllRead}
                                        className="text-[10px] text-cyan-400 font-black hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center space-y-2">
                                        <Bell size={24} className="mx-auto text-slate-700 mb-2" />
                                        <p className="text-sm text-slate-500 italic">No notifications yet.</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n._id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-4 border-b border-white/5 flex gap-3 hover:bg-slate-800/40 transition-colors cursor-pointer group
                                                ${!n.isRead ? 'bg-cyan-500/[0.03]' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                                ${!n.isRead ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${!n.isRead ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-white' : 'text-slate-500'}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {n.link && <ChevronRight size={14} className="text-slate-600" />}
                                                <button
                                                    onClick={(e) => deleteNotification(e, n._id)}
                                                    className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-slate-600 transition-colors"
                                                    title="Remove notification"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div onClick={() => { navigate('/notifications'); setIsOpen(false); }} className="block w-full p-4 text-center text-xs font-black text-slate-500 uppercase border-t border-white/5 hover:bg-slate-800 hover:text-white transition-all cursor-pointer">
                                View All Activity
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
