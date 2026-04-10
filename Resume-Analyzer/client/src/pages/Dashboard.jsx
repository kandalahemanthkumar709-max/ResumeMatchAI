import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, Loader2, Briefcase, TrendingUp, Star, Award } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { uploadResume } from '../services/resumeService';
import API from '../services/api';

export function Dashboard() {
   const { user } = useSelector((state) => state.auth);
   const navigate = useNavigate();

   useEffect(() => {
     if (user?.role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
     }
   }, [user, navigate]);

   const [file, setFile] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [result, setResult] = useState(null);

   // Application Stats
   const [appStats, setAppStats] = useState(null);
   useEffect(() => {
       API.get('/api/applications/my-applications').then(({ data }) => {
           const apps = data.data || [];
           setAppStats({
               total:      apps.length,
               screening:  apps.filter(a => a.status === 'screening').length,
               interview:  apps.filter(a => a.status === 'interview').length,
               offer:      apps.filter(a => a.status === 'offer').length,
           });
       }).catch(() => {});
   }, []);

   const handleFileChange = (e) => {
      const selected = e.target.files[0];
      if (selected && (selected.type === 'application/pdf' || selected.name.endsWith('.docx'))) {
         setFile(selected);
         setError(null);
      } else {
         setError('Only PDF or DOCX files are allowed!');
      }
   };

   const handleUpload = async () => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
         const data = await uploadResume(file);
         setResult(data.data);
      } catch (err) {
         setError(err.response?.data?.message || 'Something went wrong during analysis.');
      } finally {
         setLoading(false);
      }
   };

   const pd = result?.parsedData ?? {};
   const atsScore   = pd.score      ?? result?.atsScore ?? '—';
   const summary    = pd.summary    ?? 'No summary available.';
   const strengths  = pd.strengths  ?? [];
   const weaknesses = pd.weaknesses ?? result?.atsIssues ?? [];
   const suggestedJobs = pd.suggestedJobs ?? [];


   return (
      <div className="max-w-6xl mx-auto px-6 py-12">

         {/* Header Section */}
         <div className="mb-12">
            <h1 className="text-3xl font-bold mb-2">Resume Dashboard</h1>
            <p className="text-slate-400">Unlock your career potential with AI-driven insights.</p>
         </div>

         {/* Application Stats Bar */}
         {appStats !== null && (
             <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
             >
                 {[
                     { label: 'Total Applied',  value: appStats.total,     icon: <Briefcase size={18} />,   color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
                     { label: 'In Screening',   value: appStats.screening,  icon: <TrendingUp size={18} />,  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
                     { label: 'Interviews',     value: appStats.interview,  icon: <Star size={18} />,        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
                     { label: 'Offers',         value: appStats.offer,      icon: <Award size={18} />,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                 ].map(stat => (
                     <Link to="/tracker" key={stat.label} className="block w-full h-full">
                         <div className={`p-5 rounded-2xl border ${stat.border} ${stat.bg} flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer h-full`}>
                             <div className={`${stat.color} shrink-0`}>{stat.icon}</div>
                             <div>
                                 <p className="text-2xl font-black text-white">{stat.value}</p>
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                             </div>
                         </div>
                     </Link>
                 ))}
             </motion.div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* LEFT: Upload Box */}
            <div className="lg:col-span-4">
               <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/40 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
                     <Upload size={32} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Analyze New Resume</h3>
                  <p className="text-sm text-slate-500 mb-6">Upload your latest PDF or DOCX resume</p>

                  <input
                     type="file"
                     id="fileInput"
                     className="hidden"
                     accept=".pdf,.docx"
                     onChange={handleFileChange}
                  />

                  <label
                     htmlFor="fileInput"
                     className="w-full py-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl cursor-pointer transition-all border border-slate-700 mb-4"
                  >
                     {file ? file.name : 'Select PDF or DOCX'}
                  </label>

                  <button
                     onClick={handleUpload}
                     disabled={!file || loading}
                     className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-all shadow-lg"
                  >
                     {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Start AI Analysis'}
                  </button>

                  {error && (
                     <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-2 text-red-400 text-xs text-left w-full"
                     >
                        <AlertCircle size={14} /> {error}
                     </motion.div>
                  )}
               </div>
            </div>

            {/* RIGHT: Results Grid */}
            <div className="lg:col-span-8">
               <AnimatePresence mode="wait">
                  {!result && !loading ? (
                     <motion.div
                        key="empty"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-slate-600 border border-slate-900 rounded-3xl bg-slate-950/20 py-20"
                     >
                        <File size={48} className="mb-4 opacity-20" />
                        <p>No analysis loaded. Upload your resume to begin.</p>
                     </motion.div>
                  ) : loading ? (
                     <motion.div
                        key="loading"
                        className="h-full flex flex-col items-center justify-center space-y-4"
                     >
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                        <p className="text-cyan-400 font-medium animate-pulse">AI is reading your resume...</p>
                     </motion.div>
                  ) : (
                     <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                     >
                        {/* Score Card */}
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
                           <div>
                              <h4 className="text-slate-400 font-medium mb-1">AI ATS Score</h4>
                              <div className="text-5xl font-black text-white">{atsScore}%</div>
                           </div>
                           <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400">
                              <CheckCircle size={40} />
                           </div>
                        </div>

                        {/* Summary Section */}
                        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 italic text-slate-300">
                           <p className="text-sm">"{summary}"</p>
                        </div>

                        {/* Insight Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
                              <h5 className="font-bold mb-4 text-emerald-400 uppercase tracking-widest text-xs">Strengths</h5>
                              <ul className="space-y-2">
                                 {strengths.length > 0
                                    ? strengths.map((s, i) => (
                                       <li key={i} className="text-sm flex items-start gap-2 border-b border-white/5 pb-2 last:border-0">• {s}</li>
                                    ))
                                    : <li className="text-sm text-slate-500">No strengths identified.</li>
                                 }
                              </ul>
                           </div>
                           <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
                              <h5 className="font-bold mb-4 text-orange-400 uppercase tracking-widest text-xs">Areas to Improve</h5>
                              <ul className="space-y-2">
                                 {weaknesses.length > 0
                                    ? weaknesses.map((w, i) => (
                                       <li key={i} className="text-sm flex items-start gap-2 border-b border-white/5 pb-2 last:border-0">• {w}</li>
                                    ))
                                    : <li className="text-sm text-slate-500">No issues found.</li>
                                 }
                              </ul>
                           </div>
                        </div>

                        {suggestedJobs.length > 0 && (
                           <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20">
                              <h5 className="font-bold mb-3 text-cyan-400 text-sm">Suggested Career Paths</h5>
                              <div className="flex flex-wrap gap-2">
                                 {suggestedJobs.map((j, i) => (
                                    <span key={i} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-semibold">
                                       {j}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>
   );
}
