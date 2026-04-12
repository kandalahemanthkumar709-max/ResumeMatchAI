import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setRole } from '../../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

export default function ChooseRole() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    const handleConfirm = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            await dispatch(setRole(selected)).unwrap();
            toast.success(`Welcome aboard as a ${selected}!`);
            navigate(selected === 'recruiter' ? '/recruiter/dashboard' : '/dashboard');
        } catch (err) {
            toast.error(err.message || 'Failed to set role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-6 py-20 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl relative z-10 text-center"
            >
                <div className="mb-12">
                     <motion.div 
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-cyan-500/20"
                    >
                        <Sparkles className="text-white" size={32} />
                    </motion.div>
                    <h1 className="text-4xl font-black text-white mb-3">One Last Step</h1>
                    <p className="text-slate-500 font-medium">How will you be using ResumeMatch AI?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
                    <RoleCard 
                        id="seeker"
                        title="I'm a Seeker"
                        desc="Build your profile, analyze resumes, and find your dream job."
                        icon={<User size={32} />}
                        selected={selected === 'seeker'}
                        onClick={() => setSelected('seeker')}
                    />
                    <RoleCard 
                        id="recruiter"
                        title="I'm a Recruiter"
                        desc="Post openings, rank candidates with AI, and manage hiring."
                        icon={<Briefcase size={32} />}
                        selected={selected === 'recruiter'}
                        onClick={() => setSelected('recruiter')}
                    />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button 
                        onClick={handleConfirm}
                        disabled={!selected || loading}
                        className="px-12 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-xl flex items-center gap-3 active:scale-95 group"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Continue to Dashboard'}
                        {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                        Logged in as {user?.email}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

function RoleCard({ id, title, desc, icon, selected, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`p-8 rounded-[32px] border-2 text-left transition-all duration-300 relative overflow-hidden group
                ${selected ? 'bg-cyan-500/10 border-cyan-500 shadow-2xl shadow-cyan-500/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
        >
            <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-colors
                ${selected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                {icon}
            </div>
            <h3 className={`text-xl font-bold mb-2 transition-colors ${selected ? 'text-white' : 'text-slate-400'}`}>
                {title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {desc}
            </p>
            {selected && (
                <motion.div 
                    layoutId="active-check"
                    className="absolute top-4 right-4 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-slate-950"
                >
                    <ChevronRight size={14} />
                </motion.div>
            )}
        </button>
    );
}
