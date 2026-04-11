import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/slices/authSlice';

/**
 * LOGIN SCHEMA: The "Rules" for your form.
 * We use ZOD to define exactly how our inputs should look.
 */
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // FORM CONFIG: useForm handles the inputs, errors, and validation!
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Send Login credentials using Redux Thunk
      const result = await dispatch(login({ email: data.email, password: data.password })).unwrap();
      
      // 2. SUCCESS! Redirect based on role
      if (result.role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // 3. ERROR! Deep-dig for the actual message string
      console.error('Login Error:', err);
      // Dig into different possible formats (Redux payload, Axios response, or string)
      const errorMessage = err?.data?.message || err?.message || err?.error || (typeof err === 'string' ? err : 'Login failed. Please try again.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Determine the base API URL
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const productionApiUrl = 'https://resumematchai-m9tq.onrender.com';
    const localApiUrl = 'http://localhost:5000';
    
    const apiUrl = isLocal ? localApiUrl : productionApiUrl;
    
    // Log the redirection for debugging (visible in browser console)
    console.log(`Redirecting to: ${apiUrl}/api/auth/google`);
    
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-6 overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding/Logo */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-12"
          >
            <LogIn className="text-white -rotate-12" size={32} />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">ResumeMatch <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span></h1>
          <p className="text-slate-500 font-medium">Elevating your career with intelligence.</p>
        </div>

        <div className="p-10 rounded-[32px] bg-slate-900/40 border border-slate-800/50 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          {/* Subtle Border Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                   <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Terminal</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                  <input 
                    {...register('email')}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:bg-slate-950 outline-none transition-all placeholder:text-slate-700 text-white font-medium"
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Secure Access</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                  <input 
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:bg-slate-950 outline-none transition-all placeholder:text-slate-700 text-white font-medium"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase mt-1">{errors.password.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-white text-slate-950 font-black rounded-2xl hover:bg-cyan-400 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group/btn"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Access Dashboard <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={18} /></>}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="px-2 bg-slate-900/40 text-slate-600 tracking-widest leading-[0px]">OR CONTINUE WITH</span></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-slate-950/50 border border-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.691 1.245 6.655l4.021 3.11z"/>
                <path fill="#FBBC05" d="M1.245 6.655A11.934 11.934 0 0 0 0 12c0 1.91.445 3.718 1.245 5.345l4.021-3.11A7.064 7.064 0 0 1 4.909 12c0-1.61.555-3.082 1.482-4.235L1.245 6.655z"/>
                <path fill="#4285F4" d="M12 24c3.245 0 6.191-1.082 8.418-2.918l-4.109-3.327c-1.145.745-2.618 1.182-4.309 1.182-3.318 0-6.136-2.182-7.145-5.182l-4.021 3.11C3.191 21.309 7.273 24 12 24z"/>
                <path fill="#34A853" d="M12 4.909c1.327 0 2.536.464 3.473 1.227l3.545-3.545C17.018 1.055 14.7 0 12 0c-3.055 0-5.782 1.145-7.91 3L7.636 6.136C8.645 3.327 11.464 4.909 12 4.909z"/>
              </svg>
              Google Account
            </button>
          </div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-8 text-center text-sm font-medium text-slate-500"
        >
           Don't have an account yet? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-black">Join Waitlist</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
