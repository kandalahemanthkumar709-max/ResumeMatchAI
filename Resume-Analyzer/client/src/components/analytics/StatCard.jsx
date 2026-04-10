import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * StatCard — Premium dashboard metric display
 * 
 * Includes:
 * - Animated number
 * - Trend indicator (+/- %)
 * - Responsive skeleton state
 */
export function StatCard({ label, value, subtext, trend, icon: Icon, loading = false }) {
    if (loading) return <CardSkeleton />;

    const isPositive = trend?.startsWith('+');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 shadow-xl"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border 
                        ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                      'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}
                    </div>
                )}
            </div>

            <h3 className="text-slate-400 text-sm font-medium">{label}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                {subtext && <span className="text-slate-500 text-xs">{subtext}</span>}
            </div>
        </motion.div>
    );
}

function CardSkeleton() {
    return (
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl mb-4" />
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-2" />
            <div className="h-8 bg-slate-800 rounded w-3/4" />
        </div>
    );
}
