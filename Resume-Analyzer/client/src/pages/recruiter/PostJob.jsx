import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Briefcase, 
    Building2, 
    MapPin, 
    DollarSign, 
    FileText, 
    ChevronRight, 
    ChevronLeft, 
    CheckCircle2, 
    ArrowRight,
    Loader2,
    Zap,
    AlertCircle,
    Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';

/**
 * PostJob Page (Recruiter)
 * 
 * Multi-step form to post a new job OR edit an existing one.
 */
export function PostJob() {
    const navigate = useNavigate();
    const { jobId } = useParams();
    const isEditing = !!jobId;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        companyLogo: '',
        location: '',
        locationType: 'remote', // remote, hybrid, onsite
        jobType: 'full-time',     // full-time, part-time, contract, internship
        description: '',
        requirements: '',
        salary: {
            min: '',
            max: '',
            currency: 'USD',
            isVisible: true
        }
    });

    useEffect(() => {
        if (isEditing) {
            fetchJobData();
        }
    }, [jobId]);

    const fetchJobData = async () => {
        try {
            const { data } = await API.get(`/api/jobs/${jobId}`);
            if (data.success) {
                const job = data.data;
                setFormData({
                    title: job.title || '',
                    company: job.company || '',
                    companyLogo: job.companyLogo || '',
                    location: job.location || '',
                    locationType: job.locationType || 'remote',
                    jobType: job.jobType || 'full-time',
                    description: job.description || '',
                    requirements: job.requirements || '',
                    salary: {
                        min: job.salary?.min || '',
                        max: job.salary?.max || '',
                        currency: job.salary?.currency || 'USD',
                        isVisible: job.salary?.isVisible ?? true
                    }
                });
            }
        } catch (err) {
            setError('Failed to load job data for editing.');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('salary.')) {
            const salaryField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                salary: { ...prev.salary, [salaryField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSalaryToggle = () => {
        setFormData(prev => ({
            ...prev,
            salary: { ...prev.salary, isVisible: !prev.salary.isVisible }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        
        // Only show AI processing if it's a new job or description changed significantly
        // For simplicity, we'll show it based on isEditing
        if (!isEditing) setAiProcessing(true);

        try {
            if (isEditing) {
                await API.patch(`/api/jobs/${jobId}`, formData);
            } else {
                await API.post('/api/jobs', formData);
            }
            setSuccess(true);
            
            setTimeout(() => {
                navigate('/recruiter/dashboard');
            }, 2500);
        } catch (err) {
            console.error('Job Update/Post Error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to save job. Please try again.';
            setError(msg);
            setAiProcessing(false);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-cyan-500 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Job Data...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
                    <CheckCircle2 size={48} />
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2">Job {isEditing ? 'Updated' : 'Posted'} Successfully!</h1>
                <p className="text-slate-400 mb-8">{isEditing ? 'Changes have been saved.' : 'AI has structured your job and it\'s now live for applicants.'}</p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} className="h-full bg-cyan-500" />
                </div>
                <p className="text-xs text-slate-600 mt-4 uppercase tracking-widest font-bold">Redirecting to Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">{isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}</h1>
                <p className="text-slate-400">{isEditing ? `Refining "${formData.title}"` : 'Reach the best talent with our AI-powered matching system.'}</p>
            </header>

            <StepIndicator />

            <form onSubmit={step === 4 ? handleSubmit : e => e.preventDefault()} className="space-y-8">
                
                <AnimatePresence mode='wait'>
                    
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <motion.div 
                            key="step1" 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Briefcase size={16} className="text-cyan-500" /> Job Title
                                    </label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Senior Software Engineer" className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
                                </section>

                                <section className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Building2 size={16} className="text-cyan-500" /> Company Name
                                    </label>
                                    <input type="text" name="company" value={formData.company} onChange={handleChange} required placeholder="e.g. TechFlow Corp" className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
                                </section>
                            </div>

                            <section className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <MapPin size={16} className="text-cyan-500" /> Location
                                </label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. Bangalore, KA (or 'Remote')" className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
                            </section>
                        </motion.div>
                    )}

                    {/* STEP 2: Role Details */}
                    {step === 2 && (
                        <motion.div 
                            key="step2" 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-3">
                                    <label className="text-sm font-bold text-slate-300">Job Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['full-time', 'part-time', 'contract', 'internship'].map(t => (
                                            <button key={t} type="button" onClick={() => setFormData(p => ({ ...p, jobType: t }))} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
                                                ${formData.jobType === t ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <label className="text-sm font-bold text-slate-300">Work Setup</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['onsite', 'hybrid', 'remote'].map(t => (
                                            <button key={t} type="button" onClick={() => setFormData(p => ({ ...p, locationType: t }))} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
                                                ${formData.locationType === t ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <section className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <DollarSign size={16} className="text-cyan-500" /> Salary Range
                                    </label>
                                    <button type="button" onClick={handleSalaryToggle} className="text-xs flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.salary.isVisible ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${formData.salary.isVisible ? 'left-4.5 bg-cyan-400' : 'left-0.5 bg-slate-600'}`} />
                                        </div>
                                        Show to candidates
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="salary.min" value={formData.salary.min} onChange={handleChange} placeholder="Min Salary" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                    <input type="number" name="salary.max" value={formData.salary.max} onChange={handleChange} placeholder="Max Salary" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors" />
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-center">Currency is set to USD</p>
                            </section>
                        </motion.div>
                    )}

                    {/* STEP 3: Description & Requirements */}
                    {step === 3 && (
                        <motion.div 
                            key="step3" 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <section className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <FileText size={16} className="text-cyan-500" /> Full Description
                                </label>
                                <textarea name="description" value={formData.description} onChange={handleChange} required rows={6} placeholder="Paste the job description here. Don't worry about formatting, our AI will handle it!" className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
                            </section>

                            <section className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">Technical Requirements (Optional)</label>
                                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4} placeholder="Specific skills, languages, or tools required." className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
                            </section>
                        </motion.div>
                    )}

                    {/* STEP 4: Review */}
                    {step === 4 && (
                        <motion.div 
                            key="step4" 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="p-8 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                                    <Zap size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Almost there!</h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                                    Once you publish, our <span className="text-cyan-400 font-bold">Gemini AI</span> will automatically structure your description into machine-readable data for better matching.
                                </p>
                            </div>

                            <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Summary</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Title</p>
                                        <p className="text-white text-sm font-medium truncate">{formData.title}</p>
                                    </div>
                                    <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Company</p>
                                        <p className="text-white text-sm font-medium truncate">{formData.company}</p>
                                    </div>
                                </div>
                            </section>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3 text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                    <button type="button" onClick={handleBack} disabled={step === 1 || submitting} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors disabled:opacity-0">
                        <ChevronLeft size={18} /> Previous
                    </button>

                    {step < 4 ? (
                        <button type="button" onClick={handleNext} className="flex items-center gap-2 px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                            {aiProcessing ? (
                                <><Loader2 size={18} className="animate-spin" /> AI is structuring...</>
                            ) : (
                                <>{isEditing ? 'Save Changes' : 'Publish Job'} <ArrowRight size={18} /></>
                            )}
                        </button>
                    )}
                </div>

            </form>
        </div>
    );
}
