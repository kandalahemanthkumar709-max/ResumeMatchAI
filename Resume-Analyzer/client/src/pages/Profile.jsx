import { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, Loader2, Camera, LogOut, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import API from '../services/api';
import { loadUser } from '../redux/slices/authSlice';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    // Update local state if redux user changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.patch('/api/auth/profile', formData);
            
            // IMPORTANT: Update the token so the session matches the new email
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            
            toast.success('Profile updated successfully!');
            dispatch(loadUser()); // Refresh global state
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <header className="mb-12">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                    <Shield size={18} />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Account Management</span>
                </div>
                <h1 className="text-4xl font-black text-white">Your Profile</h1>
                <p className="text-slate-500 mt-2">Update your personal information and contact settings.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar Card */}
                <div className="space-y-6">
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[3rem] text-center space-y-4">
                        <div className="relative inline-block group">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-cyan-500/20">
                                {user?.name?.charAt(0)}
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 group-hover:text-white transition-colors">
                                <Camera size={16} />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{user?.name}</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{user?.role}</p>
                        </div>
                        <div className="pt-4 flex flex-col gap-2">
                             <div className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20 uppercase">
                                <CheckCircle2 size={12} /> Verified Account
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }} 
                        className="w-full p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[2rem] font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Logout Session
                    </button>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <User size={14} /> Full Name
                                </label>
                                <input 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-medium focus:border-cyan-500 outline-none transition-all shadow-inner"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Mail size={14} /> Email Address
                                </label>
                                <input 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-medium focus:border-cyan-500 outline-none transition-all shadow-inner"
                                    placeholder="your@email.com"
                                />
                                <p className="text-[10px] text-slate-600 px-1 italic">Notifications will be sent to this address.</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                            <button 
                                type="button"
                                onClick={async () => {
                                    try {
                                        await API.post('/api/auth/test-email');
                                        toast.success('Test email sent! Check your inbox.');
                                    } catch (err) {
                                        toast.error('Email test failed. Check server logs.');
                                    }
                                }}
                                className="px-6 py-4 bg-slate-800 text-slate-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-700 hover:text-white transition-all text-[10px]"
                            >
                                Send Test Email
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl shadow-cyan-500/30 flex items-center gap-3 disabled:opacity-50 text-xs"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
