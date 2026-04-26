import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { register as registerUserThunk } from '../../redux/slices/authSlice';

/**
 * REGISTER SCHEMA: Validation rules for signing up.
 * refine(): Adds custom checks (like "Confirm Password" must match "Password").
 */
const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['seeker', 'recruiter'], 'Please choose a role'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match!",
  path: ["confirmPassword"],
});

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Submit Registration using Redux Thunk
      const result = await dispatch(registerUserThunk(data)).unwrap();
      
      // 2. SUCCESS! Redirect based on role
      if (result.role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // 3. ERROR! Deep-dig for the actual message string
      console.error('Registration Error:', err);
      // Dig into different possible formats (Redux payload, Axios response, or string)
      const errorMessage = err?.data?.message || err?.message || err?.error || (typeof err === 'string' ? err : 'Registration failed. Please try again.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-6 py-20 overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Branding/Logo */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)] rotate-6"
          >
            <Sparkles className="text-white -rotate-6" size={26} />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Account</span></h1>
          <p className="text-slate-500 font-medium">Join the next generation of AI-powered job matching.</p>
        </div>

        <div className="p-10 rounded-[32px] bg-slate-900/40 border border-slate-800/50 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                   <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Name Input */}
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                      <input {...register('name')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 outline-none transition-all text-white font-medium" placeholder="John Doe" />
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.name.message}</p>}
                 </div>

                 {/* Role Selector */}
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Member Role</label>
                    <select {...register('role')} className="w-full px-5 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 outline-none appearance-none cursor-pointer text-white font-bold text-sm">
                       <option value="seeker">I'm a Job Seeker</option>
                       <option value="recruiter">I'm a Recruiter</option>
                    </select>
                    {errors.role && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.role.message}</p>}
                 </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Activation Email</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                  <input {...register('email')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 outline-none transition-all text-white font-medium" placeholder="test@example.com" />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Password Input */}
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                      <input 
                        {...register('password')} 
                        type={showPassword ? "text" : "password"} 
                        className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 outline-none transition-all text-white font-medium" 
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
                   {errors.password && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.password.message}</p>}
                 </div>

                 {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Verify Key</label>
                    <div className="relative group/input">
                      <input 
                        {...register('confirmPassword')} 
                        type={showConfirmPassword ? "text" : "password"} 
                        className="w-full px-5 pr-12 py-4 rounded-2xl bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 outline-none transition-all text-white font-medium" 
                        placeholder="••••••••" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.confirmPassword.message}</p>}
                  </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 mt-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-cyan-400 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Initialize Account</>}
              </button>
            </form>
          </div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-8 text-center text-sm font-medium text-slate-500"
        >
           Already secure? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-black">Sign in instead</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
