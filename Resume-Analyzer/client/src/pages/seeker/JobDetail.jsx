import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    MapPin, 
    Calendar, 
    DollarSign, 
    Briefcase, 
    ChevronLeft, 
    Building2, 
    Clock, 
    CheckCircle2, 
    ArrowRight,
    Loader2,
    AlertCircle,
    Globe,
    Zap,
    Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

/**
 * JobDetail Page
 * 
 * Displays full information about a specific job.
 * Shows structured AI data (skills, responsibilities) separately for better readability.
 */
export function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [matchData, setMatchData] = useState(null);

    useEffect(() => {
        const fetchJobAndMatch = async () => {
            try {
                // 1. Fetch Job
                console.log(`📡 Fetching job detail for ID: ${id}...`);
                const { data: response } = await API.get(`/api/jobs/${id}`);
                
                if (response.success && response.data) {
                    setJob(response.data);
                    setError(null);
                } else {
                    setError('Job listing no longer exists.');
                    return;
                }

                // 2. Fetch Extra info (Non-blocking)
                if (isAuthenticated) {
                    // Application Status
                    try {
                        const appRes = await API.get('/api/applications/my-applications');
                        const applied = appRes.data.data.some(app => app.jobId._id === id || app.jobId === id);
                        setHasApplied(applied);
                    } catch (e) { console.warn("App status fetch failed"); }

                    // Match results
                    try {
                        const { data: resData } = await API.get('/api/resumes');
                        const defResume = resData.data.find(r => r.isDefault) || resData.data[0];
                        if (defResume) {
                            const matchRes = await API.get(`/api/matches/${defResume._id}/${id}`);
                            setMatchData({
                                ...matchRes.data.data,
                                resumeLabel: defResume.label
                            });
                        }
                    } catch (e) { console.warn("Match data fetch failed"); }
                }

            } catch (err) {
                const msg = err.response?.data?.message || err.message || 'Job not found';
                console.error('❌ JobDetail Main Fetch Error:', err);
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchJobAndMatch();
    }, [id, isAuthenticated]);

    const handleApply = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to apply');
            navigate('/login');
            return;
        }

        if (user?.role !== 'seeker') {
            toast.error('Only seekers can apply to jobs');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Get Seeker's Resumes to find the default one
            const { data: resumeData } = await API.get('/api/resumes');
            const defaultResume = resumeData.data.find(r => r.isDefault) || resumeData.data[0];

            if (!defaultResume) {
                toast.error('Please upload a resume first');
                navigate('/resumes');
                return;
            }

            // 2. Submit Application
            await API.post('/api/applications', {
                jobId: id,
                resumeId: defaultResume._id
            });

            setHasApplied(true);
            toast.success('Application submitted successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-cyan-500 animate-spin mb-4" />
                <p className="text-slate-400">Fetching job details...</p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Oops! {error}</h2>
                <button 
                    onClick={() => navigate('/jobs')}
                    className="text-cyan-400 hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                    <ChevronLeft size={16} /> Back to Job Listings
                </button>
            </div>
        );
    }

    const postedDate = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });
    
    // Salary Formatter
    const formatSalary = () => {
        if (!job.salary?.isVisible) return 'Competitive salary';
        if (!job.salary?.min && !job.salary?.max) return 'Salary not specified';
        
        const currency = job.salary.currency || 'USD';

        // Custom formatting for Indian Rupees (LPA)
        if (currency === 'INR') {
            const toLPA = (val) => (val / 100000).toFixed(1).replace(/\.0$/, '') + ' LPA';
            if (job.salary.min && job.salary.max) {
                return `₹${toLPA(job.salary.min)} – ${toLPA(job.salary.max)}`;
            }
            return `From ₹${toLPA(job.salary.min || job.salary.max)}`;
        }

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency', currency, maximumFractionDigits: 0,
        });
        if (job.salary.min && job.salary.max) {
            return `${formatter.format(job.salary.min)} – ${formatter.format(job.salary.max)}`;
        }
        return `From ${formatter.format(job.salary.min || job.salary.max)}`;
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Back Button */}
            <button 
                onClick={() => navigate('/jobs')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
            >
                <ChevronLeft size={18} />
                Back to Search
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content (Left 2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Job Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 overflow-hidden shadow-xl shadow-slate-950/50">
                                <img 
                                    src={job.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0ea5e9&color=fff&bold=true&size=128`} 
                                    alt={job.company} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=64748b&color=fff&size=128`; }}
                                />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                                    <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                                        <Building2 size={16} /> {job.company}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={16} /> {job.location} ({job.locationType})
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={16} /> {postedDate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Salary Range</p>
                                <p className="text-white font-semibold text-sm">{formatSalary()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Job Type</p>
                                <p className="text-white font-semibold text-sm capitalize">{job.jobType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Experience</p>
                                <p className="text-white font-semibold text-sm">{job.structuredData?.min_experience_years || 0}+ Years</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Seniority</p>
                                <p className="text-white font-semibold text-sm capitalize">{job.structuredData?.seniority_level || 'Mid'}</p>
                            </div>
                        </div>

                        {user?.role === 'recruiter' ? (
                            job.postedBy?._id === user?._id || job.postedBy === user?._id ? (
                                <button 
                                    onClick={() => navigate(`/recruiter/jobs/${job._id}/candidates`)}
                                    className="w-full mt-8 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20 active:scale-95"
                                >
                                    View Candidates
                                </button>
                            ) : (
                                <div className="w-full mt-8 py-4 px-6 rounded-2xl font-bold text-center text-slate-500 bg-slate-900 border border-slate-800">
                                    Recruiters cannot apply to jobs
                                </div>
                            )
                        ) : (
                            <button 
                                onClick={handleApply}
                                disabled={submitting || hasApplied}
                                className={`w-full mt-8 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 ${
                                    hasApplied 
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' 
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20 active:scale-95'
                                } disabled:opacity-70`}
                            >
                                {submitting ? (
                                    <><Loader2 size={20} className="animate-spin" /> Processing...</>
                                ) : hasApplied ? (
                                    <><CheckCircle2 size={20} /> Applied Successfully</>
                                ) : (
                                    'Apply for this Position'
                                )}
                            </button>
                        )}
                    </motion.div>

                    {/* Job Description */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">Role Description</h2>
                            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </div>

                        {job.structuredData?.responsibilities?.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Key Responsibilities</h2>
                                <ul className="space-y-3">
                                    {job.structuredData.responsibilities.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-slate-300">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Sidebar (Right 1/3) */}
                <div className="space-y-6">
                    
                    {/* Skills Section */}
                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Briefcase size={18} className="text-cyan-400" />
                            Technical Requirements
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-widest">Required Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {job.structuredData?.required_skills?.map((skill, i) => {
                                        const isMatched = matchData?.matchedSkills?.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()));
                                        return (
                                            <span 
                                                key={i} 
                                                className={`px-3 py-1 border rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                                                    isMatched 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                                                    : 'bg-cyan-500/5 text-cyan-400/70 border-cyan-500/10'
                                                }`}
                                            >
                                                {isMatched && <CheckCircle2 size={12} className="text-emerald-500" />}
                                                {skill}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {job.structuredData?.nice_to_have_skills?.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-widest">Nice to Have</p>
                                    <div className="flex flex-wrap gap-2">
                                        {job.structuredData.nice_to_have_skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-widest">Education</p>
                                <p className="text-slate-300 text-sm">
                                    {job.structuredData?.education_required || 'Degree not specified'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Match Score Badge */}
                    {isAuthenticated && user?.role === 'seeker' && (
                        <div className={`p-6 bg-gradient-to-br border rounded-3xl overflow-hidden relative group ${
                            (matchData?.overallScore || 0) >= 70 
                            ? 'from-emerald-600/20 to-cyan-600/20 border-emerald-500/30' 
                            : 'from-amber-600/20 to-orange-600/20 border-amber-500/30'
                        }`}>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-500" />
                            <h4 className="text-slate-400 font-bold text-xs mb-2 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" />
                                AI Compatibility Score
                            </h4>
                            
                            {matchData ? (
                                <>
                                    <div className="flex items-end gap-2 mb-3">
                                        <span className="text-4xl font-black text-white">{Math.round(matchData.overallScore)}%</span>
                                        <span className={`text-sm font-medium mb-1 ${
                                            matchData.overallScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                            {matchData.overallScore >= 80 ? 'Perfect Match' : matchData.overallScore >= 60 ? 'Good Match' : 'Possible Match'}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Your {matchData.resumeLabel || 'resume'} matches the following criteria:
                                        </p>
                                        
                                        {/* Quick Skill Match Summary */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {matchData.matchedSkills?.map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> {s}
                                                </span>
                                            ))}
                                            {matchData.missingSkills?.map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-red-500/10 text-red-500/60 rounded text-[10px] flex items-center gap-1 line-through">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-2">
                                    <p className="text-slate-400 text-xs">Analyzing your profile compatibility...</p>
                                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="h-full w-1/3 bg-cyan-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hiring Manager Card */}
                    {job.postedBy && (
                        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Mail size={18} className="text-cyan-400" />
                                Hiring Manager
                            </h3>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold border border-slate-700">
                                    {job.postedBy.name?.charAt(0) || 'R'}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm leading-tight">{job.postedBy.name}</p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase">Recruiter</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `mailto:${job.postedBy.email}?subject=Regarding the ${job.title} position`;
                                }}
                                className="w-full py-3 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Mail size={14} /> Contact Recruiter
                            </button>
                        </div>
                    )}

                    {/* About Company */}
                    <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Building2 size={18} className="text-cyan-400" />
                            About Company
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            Learn more about working at <span className="text-white font-medium">{job.company}</span>. 
                            This is a {job.locationType} based role in {job.location}.
                        </p>
                        <Link to="#" className="text-cyan-400 text-sm font-medium flex items-center gap-1 hover:underline">
                            View Company Website <Globe size={14} />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
