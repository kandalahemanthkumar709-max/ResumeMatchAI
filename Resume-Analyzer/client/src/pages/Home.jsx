import { motion } from 'framer-motion';
import { Bot, FileText, Briefcase, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Home Page - The First Impession
 * As your mentor, I recommend always starting with a stunning 
 * "Landing" experience. Here we'll show what the AI can do!
 * We'll use framer-motion for smooth entrance animations.
 */

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden">
      
      {/* Background Decor: Animated Gradients */}
      <div className="absolute top-0 -z-10 h-full w-full bg-slate-950">
        <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(173,109,244,0.15)] opacity-50 blur-[80px]"></div>
        <div className="absolute top-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium border border-cyan-500/30 rounded-full bg-cyan-500/10 text-cyan-400 mb-6 uppercase tracking-wider">
          <Zap size={14} className="fill-current" />
          Powered by Groq Llama 3 AI
        </span>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
          The Future of Hiring is <span className="text-cyan-400">Intelligent.</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your resume and get instant 1-on-1 AI feedback, skill gap analysis, 
          and job matches tailored precisely to your experience level.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 transform hover:-translate-y-1 decoration-transparent">
            Get Started Free
          </Link>
        </div>
      </motion.div>


      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl w-full">
        <FeatureCard 
          icon={<Bot size={28} />}
          title="AI Analysis"
          desc="Get deep insights into your resume from our fine-tuned AI analyzer."
        />
        <FeatureCard 
          icon={<FileText size={28} />}
          title="Skill Mapping"
          desc="Visualize your strengths and find exactly which skills you lack for your dream job."
        />
        <FeatureCard 
          icon={<Briefcase size={28} />}
          title="Smart Matches"
          desc="Direct job matches from our live database based on your parsed data."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 border border-slate-800 rounded-2xl bg-slate-900/40 backdrop-blur-sm transition-all"
    >
      <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">
        {desc}
      </p>
    </motion.div>
  );
}
