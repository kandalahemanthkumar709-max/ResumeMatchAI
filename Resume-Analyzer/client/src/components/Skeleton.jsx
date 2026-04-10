import { motion } from 'framer-motion';

/**
 * Skeleton — Versatile loading state component
 * 
 * Usage:
 * <Skeleton className="h-4 w-1/2" />
 * <Skeleton variant="circle" className="h-12 w-12" />
 */
export function Skeleton({ className, variant = 'rect' }) {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className={`bg-slate-800/60 ${variant === 'circle' ? 'rounded-full' : 'rounded-xl'} ${className}`}
        />
    );
}

/**
 * DashboardSkeleton — Pre-built skeleton for entire pages
 */
export function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl h-32" />
                ))}
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-3xl" />
                <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-3xl" />
            </div>
        </div>
    );
}
