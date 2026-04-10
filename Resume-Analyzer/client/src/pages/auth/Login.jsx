import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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
      // 3. ERROR! Handle wrong credentials or missing accounts
      setError(err.message || err || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
     // Sends the user to our backend Google Auth start path!
     window.location.href = 'http://127.0.0.1:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome Back!</h1>
           <p className="text-slate-400">Sign in to continue your career journey.</p>
        </div>

        {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                 <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input 
                {...register('email')}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none transition-all"
                placeholder="test@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 ml-1 mt-1">{errors.email.message}</p>}
          </div>

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
            {errors.password && <p className="text-xs text-red-500 ml-1 mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        {/* Google OAuth Option */}
        <div className="mt-8">
           <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <span className="relative px-4 text-xs font-medium text-slate-600 bg-slate-900 scale-100">OR CONTINUE WITH</span>
           </div>
           
           <button 
             onClick={handleGoogleLogin}
             className="w-full py-4 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-xl transition-all flex items-center justify-center gap-3 font-semibold"
           >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google logo" />
              Sign in with Google
           </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
           New here? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-bold">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
