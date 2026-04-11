import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-10 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl"
      >
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold mb-2">Create Account</h1>
           <p className="text-slate-400">Join the next generation of job matching.</p>
        </div>

        {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                 <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Name Input */}
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
               <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input {...register('name')} className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-950 border border-slate-800 outline-none" placeholder="John Doe" />
               </div>
               {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
             </div>

             {/* Role Selector */}
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-300 ml-1">Account Type</label>
               <select {...register('role')} className="w-full px-4 py-4 rounded-xl bg-slate-950 border border-slate-800 outline-none appearance-none cursor-pointer">
                  <option value="seeker">I'm a Job Seeker</option>
                  <option value="recruiter">I'm a Recruiter</option>
               </select>
               {errors.role && <p className="text-xs text-red-500 ml-1">{errors.role.message}</p>}
             </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input {...register('email')} className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-950 border border-slate-800 outline-none" placeholder="test@example.com" />
            </div>
            {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Password Input */}
             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input 
                    {...register('password')} 
                    type={showPassword ? "text" : "password"} 
                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none transition-all" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
               {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
             </div>

             {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
                <div className="relative group">
                  <input 
                    {...register('confirmPassword')} 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="w-full px-4 pr-12 py-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none transition-all" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 ml-1 mt-1">{errors.confirmPassword.message}</p>}
              </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
           Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold underline">Sign in instead</Link>
        </p>
      </motion.div>
    </div>
  );
}
