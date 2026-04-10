import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * MatchScoreRing — SVG circular progress ring
 * 
 * THE SVG STROKE-DASHARRAY TRICK:
 * 1. We create a circle with a specific circumference (2 * PI * R).
 * 2. stroke-dasharray lets us split the border into dashes.
 * 3. stroke-dashoffset "shifts" those dashes.
 * 4. By setting dasharray to the full circumference and dashoffset to 
 *    (1 - percentage) * circumference, only a PORTION of the circle is visible.
 */
export function MatchScoreRing({ score, size = 60, strokeWidth = 5 }) {
    const [offset, setOffset] = useState(0);
    
    // R = (size/2) - strokeWidth
    const radius = (size / 2) - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        // Calculate offset based on score (0-100)
        const progressOffset = ((100 - score) / 100) * circumference;
        setOffset(progressOffset);
    }, [score, circumference]);

    const getColor = (s) => {
        if (s >= 90) return 'text-purple-500';  // Elite match
        if (s >= 75) return 'text-emerald-500'; // Strong match
        if (s >= 50) return 'text-amber-500';   // Good match
        return 'text-red-500';                 // Weak match
    };

    const getBgColor = (s) => {
        if (s >= 90) return 'stroke-purple-500/20';
        if (s >= 75) return 'stroke-emerald-500/20';
        if (s >= 50) return 'stroke-amber-500/20';
        return 'stroke-red-500/20';
    };

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    className={getBgColor(score)}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                
                {/* Foreground Progress Circle */}
                <motion.circle
                    className={getColor(score)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            
            {/* Score digit in the center */}
            <span className={`absolute text-xs font-black ${getColor(score)}`}>
                {score}%
            </span>
        </div>
    );
}
