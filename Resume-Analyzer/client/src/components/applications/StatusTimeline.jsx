import { CheckCircle2, Circle, Clock, MessageSquare } from 'lucide-react';

/**
 * STATUS TIMELINE
 * 
 * Shows a vertical visual history of an application's progress.
 */
export function StatusTimeline({ history }) {
    if (!history || history.length === 0) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'applied':   return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'screening': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
            case 'interview': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'offer':     return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'rejected':  return 'text-red-500 bg-red-500/10 border-red-500/20';
            default:          return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-[11px] before:w-0.5 before:bg-slate-800 before:content-['']">
            {history.slice().reverse().map((item, idx) => (
                <div key={idx} className="relative pl-10">
                    {/* Circle on line */}
                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-slate-950 flex items-center justify-center
                        ${idx === 0 ? 'bg-cyan-500 z-10' : 'bg-slate-800'}`}>
                        {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                                {item.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                <Clock size={10} /> {new Date(item.changedAt).toLocaleString()}
                            </span>
                        </div>
                        
                        {item.note && (
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl mt-2 flex items-start gap-2 max-w-sm">
                                <MessageSquare size={12} className="text-slate-600 mt-1 shrink-0" />
                                <p className="text-xs text-slate-400 italic">"{item.note}"</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
