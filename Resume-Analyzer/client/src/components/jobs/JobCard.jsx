import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Bookmark, ExternalLink, Briefcase, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * JobCard Component
 *
 * Props:
 *   job      {Object}  - Job document from the API
 *   matchPct {number}  - Optional AI match percentage (0-100)
 */
export function JobCard({ job, matchPct = null, index = 0, isApplied = false }) {
    const navigate = useNavigate();

    /**
     * formatDistanceToNow from date-fns:
     * Takes a Date and returns a human-readable string like "2 days ago", "about 1 hour ago"
     * addSuffix: true → adds "ago" automatically
     */
    const postedAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });

    // Salary display helper
    const formatSalary = () => {
        if (!job.salary?.isVisible) return 'Competitive';
        if (!job.salary?.min && !job.salary?.max) return 'Not disclosed';
        
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

    // Match score colour coding
    const matchColor =
        matchPct >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
        matchPct >= 60 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
        matchPct !== null ? 'bg-red-500/15 text-red-400 border-red-500/30' : '';

    // Job type badge colours
    const typeColor = {
        'full-time':  'bg-blue-500/10 text-blue-400',
        'part-time':  'bg-purple-500/10 text-purple-400',
        'contract':   'bg-orange-500/10 text-orange-400',
        'internship': 'bg-pink-500/10 text-pink-400',
        'freelance':  'bg-teal-500/10 text-teal-400',
    }[job.jobType] || 'bg-slate-500/10 text-slate-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative p-6 bg-slate-900/50 border border-slate-800 rounded-3xl
                       hover:border-slate-600 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/jobs/${job._id}`)}
        >
            {/* Match badge (top-right) */}
            {matchPct !== null && (
                <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold border ${matchColor}`}>
                    {matchPct}% Match
                </div>
            )}

            {isApplied && (
                <div className="absolute top-14 right-4 px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-blue-500/10">
                    <CheckCircle2 size={10} /> Applied
                </div>
            )}

            {/* Company info & Recruiter */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img 
                        src={job.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=0ea5e9&color=fff&bold=true`} 
                        alt={job.company} 
                        className="w-11 h-11 rounded-xl object-cover bg-slate-800 border border-slate-700/50 shadow-sm"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=64748b&color=fff`; }}
                    />
                    <div>
                        <p className="text-white font-semibold text-sm leading-tight">{job.company}</p>
                        <p className="text-slate-500 text-xs">{job.location}</p>
                    </div>
                </div>
                {job.postedBy?.name && (
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hiring</p>
                        <p className="text-xs text-cyan-400 font-medium truncate max-w-[100px]">{job.postedBy.name}</p>
                    </div>
                )}
            </div>

            {/* Job title */}
            <h3 className="text-white font-bold text-lg mb-3 group-hover:text-cyan-400 transition-colors pr-16 leading-snug">
                {job.title}
            </h3>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeColor}`}>
                    {job.jobType}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-400">
                    <MapPin size={10} /> {job.locationType}
                </span>
            </div>

            {/* Skills preview */}
            {job.structuredData?.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.structuredData.required_skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded-md text-xs">
                            {skill}
                        </span>
                    ))}
                    {job.structuredData.required_skills.length > 4 && (
                        <span className="px-2 py-0.5 text-slate-500 text-xs">
                            +{job.structuredData.required_skills.length - 4} more
                        </span>
                    )}
                </div>
            )}

            {/* Footer: salary + time */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                    <DollarSign size={14} />
                    {formatSalary()}
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock size={11} />
                    {postedAgo}
                </div>
            </div>
        </motion.div>
    );
}
