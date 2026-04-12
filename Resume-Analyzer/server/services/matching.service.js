import MatchCache from '../models/MatchCache.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import { generateMatchReasoning } from './ai.service.js';

/**
 * MATCHING SERVICE — The Brain of the System
 * 
 * SCORING MATH EXAMPLE:
 * Job requires: [React, Node.js, AWS, TypeScript] (4 skills)
 * 
 * Candidate 1:
 * - Has React, Node.js (Exact matches: 2)
 * - Has "TS" (Partial match for TypeScript: 0.5)
 * - Has no AWS (Missing: 1)
 * 
 * Skill Score = (2 * 1.0 + 0.5) / 4 * 100 = 62.5%
 */

// Common Tech Skill Synonyms/Groups for better matching
const SKILL_SYNONYMS = {
    'java': ['java', 'java8', 'java11', 'java17', 'jdk', 'jre', 'j2ee', 'spring boot', 'spring framework'],
    'javascript': ['js', 'javascript', 'ecmascript', 'es6', 'es7', 'javascriptes6', 'javascriptes7', 'js-es6'],
    'typescript': ['ts', 'tsx', 'typescript'],
    'node.js': ['nodejs', 'node', 'node-js'],
    'react': ['reactjs', 'react.js', 'react-js', 'react native', 'jsx', 'next.js', 'nextjs'],
    'mongodb': ['mongo', 'mongoose', 'nosql-database', 'mongodb'],
    'express': ['expressjs', 'express.js', 'express-js'],
    'tailwind css': ['tailwind', 'tailwindcss', 'utility-css'],
    'machine learning': ['ml', 'statistical modeling', 'predictive modeling'],
    'deep learning': ['dl', 'neural networks', 'cnn', 'rnn'],
    'artificial intelligence': ['ai', 'agentic ai', 'artificial-intelligence'],
    'natural language processing': ['nlp', 'llm', 'large language models', 'transformers', 'bert', 'gpt'],
    'sql': ['postgresql', 'mysql', 'mssql', 'sqlite', 'relational database', 'postgres', 'sql server'],
    'nosql': ['mongodb', 'cassandra', 'redis', 'dynamodb', 'couchbase'],
    'cloud': ['aws', 'gcp', 'azure', 'amazon web services', 'google cloud', 'cloud computing'],
    'docker': ['containerization', 'kubernetes', 'k8s', 'containers'],
    'pytorch': ['torch', 'torchvision', 'torchaudio'],
    'tensorflow': ['tf', 'keras'],
    'rest apis': ['restful', 'api design', 'json apis', 'rest-apis', 'restful-apis'],
};

/**
 * calculateSkillScore — Compares resume skills against job requirements
 */
export const calculateSkillScore = (resumeSkills = [], jobRequired = [], jobNiceToHave = []) => {
    if (jobRequired.length === 0) return { score: 100, matchedSkills: [], missingSkills: [], partialSkills: [] };

    const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rSkills = resumeSkills.map(clean);
    
    let exactMatches = [];
    let partialMatches = [];
    let missingSkills = [];

    // Helper to check if a skill matches any synonym in a group
    const checkMatch = (req, resumeList) => {
        const cleanReq = clean(req);
        if (resumeList.includes(cleanReq)) return 'exact';

        // Check synonyms with a stricter membership test to avoid false positives (e.g. Java matching JavaScript)
        for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
            const allInGroup = [canonical, ...synonyms].map(clean);
            
            // Does this requirement belong to this group?
            // Use exact match or very specific substring (like 'sql' in 'mysql') but skip 'java'
            const reqBelongsToGroup = allInGroup.some(member => {
                if (member === cleanReq) return true;
                // Allow 'sql' to match 'mysql' etc, but PROTECT 'java' from 'javascript'
                if (cleanReq === 'java' && member.includes('javascript')) return false;
                if (cleanReq.length >= 3 && member.includes(cleanReq)) return true;
                return false;
            });

            if (reqBelongsToGroup) {
                // If it does, does the resume have ANY skill from this same group?
                if (resumeList.some(rs => allInGroup.some(member => member === rs || rs.includes(member)))) {
                    return 'exact'; 
                }
            }
        }

        // Partial match fallback for things not in synonym groups
        const partial = resumeSkills.find(rs => {
            const cRs = clean(rs);
            if (cRs.length <= 3 || cleanReq.length <= 3) return false;
            
            // Stricter partial match: avoid Java/JavaScript overlap here too
            if ((cleanReq === 'java' && cRs.includes('javascript')) || 
                (cRs === 'java' && cleanReq.includes('javascript'))) {
                return false;
            }

            return cRs.includes(cleanReq) || cleanReq.includes(cRs);
        });
        
        return partial ? 'partial' : 'none';
    };

    jobRequired.forEach(req => {
        const matchType = checkMatch(req, rSkills);
        
        if (matchType === 'exact') {
            exactMatches.push(req);
        } else if (matchType === 'partial') {
            partialMatches.push(req);
        } else {
            missingSkills.push(req);
        }
    });

    // Weighted Score: Exact = 1pt, Partial = 0.5pt
    const points = (exactMatches.length * 1.0) + (partialMatches.length * 0.5);
    const score = Math.min(100, Math.round((points / jobRequired.length) * 100));

    return { score, matchedSkills: exactMatches, missingSkills, partialSkills: partialMatches };
};


/**
 * calculateExperienceScore — Checks if years of exp meets min requirement
 */
export const calculateExperienceScore = (resumeExp = [], jobMinYears = 0) => {
    if (jobMinYears === 0) return 100;

    // Total years calculation
    // We assume the resume parser extracted a clean 'years' number or we calculate from dates
    // For this logic, let's assume raw total is available or calculated:
    let totalYears = 0;
    resumeExp.forEach(exp => {
        if (exp.durationInYears && !isNaN(exp.durationInYears)) {
            totalYears += Number(exp.durationInYears);
        } else if (exp.startDate) { // Manual calculation fallback
            const start = new Date(exp.startDate);
            let end = new Date(); // fallback to 'now'
            
            if (exp.endDate && typeof exp.endDate === 'string') {
                const lowerEnd = exp.endDate.toLowerCase();
                if (!['present', 'current', 'now', 'to date'].includes(lowerEnd)) {
                    const parsedEnd = new Date(exp.endDate);
                    if (!isNaN(parsedEnd.getTime())) {
                        end = parsedEnd;
                    }
                }
            }

            if (!isNaN(start.getTime())) {
                const diff = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
                totalYears += Math.max(0, diff);
            }
        }
    });

    if (totalYears >= jobMinYears) return 100;
    if (totalYears >= jobMinYears * 0.7) return 70;
    if (totalYears >= jobMinYears * 0.4) return 40;
    return 10;
};

/**
 * calculateEducationScore — Weight rankings for degrees
 */
export const calculateEducationScore = (resumeEdu = [], jobRequired = '') => {
    // If job doesn't specify, we give a high base score but not necessarily 100 if the resume is empty
    if (!jobRequired || jobRequired.toLowerCase().includes('not specified')) {
        return resumeEdu.length > 0 ? 100 : 70; 
    }

    const rankings = { 
        'high school': 1, 'ssc': 1, 'inter': 1, 'intermediate': 1,
        'associate': 2, 'diploma': 2,
        'bachelor': 3, 'btech': 3, 'be': 3, 'bsc': 3, 'degree': 3,
        'master': 4, 'mtech': 4, 'me': 4, 'msc': 4, 'mba': 4,
        'phd': 5, 'doctorate': 5 
    };
    
    // Find highest degree in resume
    let highestRank = 0;
    resumeEdu.forEach(edu => {
        const degree = (edu.degree || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const field = (edu.field || '').toLowerCase();
        
        Object.keys(rankings).forEach(key => {
            if (degree.includes(key.replace(/ /g, '')) && rankings[key] > highestRank) {
                highestRank = rankings[key];
            }
        });
    });

    // Find ranking of requirement
    let reqRank = 0;
    const cleanReq = jobRequired.toLowerCase().replace(/[^a-z0-9]/g, '');
    Object.keys(rankings).forEach(key => {
        if (cleanReq.includes(key.replace(/ /g, ''))) {
            if (rankings[key] > reqRank) reqRank = rankings[key];
        }
    });

    // Score Calculation (Education Percentage)
    if (highestRank >= reqRank && reqRank > 0) return 100;
    if (reqRank === 0) return 100; // Requirement was vague
    
    // Graduated scoring for education match
    const diff = highestRank - reqRank;
    if (diff === -1) return 70;  // One level below (e.g. Master req, Bachelor have)
    if (diff === -2) return 40;  // Two levels below
    if (highestRank > 0) return 20; // Has some education but far below
    
    return 0;
};

/**
 * calculateLocationScore — Scoring based on work setup
 */
export const calculateLocationScore = (seekLoc, jobLoc, type) => {
    if (type === 'remote') return 100;
    
    const sLoc = (seekLoc || '').toLowerCase();
    const jLoc = (jobLoc || '').toLowerCase();

    if (sLoc.includes(jLoc) || jLoc.includes(sLoc)) return 100; // Same city
    
    // Check if in same state/country (very basic check)
    if (sLoc.split(',').pop().trim() === jLoc.split(',').pop().trim()) return 50;

    return type === 'hybrid' ? 30 : 0;
};

/**
 * getOrCreateMatch — Core logic to get match score, using cache where possible
 */
export const getOrCreateMatch = async (seekerId, resumeId, jobId, options = { skipAI: false }) => {
    // 1. Check Cache
    const cached = await MatchCache.findOne({ seekerId, resumeId, jobId });
    
    // If we have a cache and it either has reasoning OR we don't need reasoning, return it!
    if (cached && (cached.reasoning || options.skipAI)) return cached;

    // 2. Not in Cache? Fetch raw data
    const resume = await Resume.findById(resumeId);
    const job    = await Job.findById(jobId);
    
    if (!resume || !job) throw new Error('Resume or Job not found');

    // 3. Run Math Scoring
    const rSkills = [
        ...(resume.parsedData?.skills?.hard || []),
        ...(resume.parsedData?.skills?.soft || []),
        ...(resume.parsedData?.skills?.tools || [])
    ];

    const skillResult = calculateSkillScore(
        rSkills, 
        job.structuredData?.required_skills || [],
        job.structuredData?.nice_to_have_skills || []
    );

    const expScore = calculateExperienceScore(
        resume.parsedData?.experience || [],
        job.structuredData?.min_experience_years || 0
    );

    const eduScore = calculateEducationScore(
        resume.parsedData?.education || [],
        job.structuredData?.education_required || ''
    );

    const locScore = calculateLocationScore(
        resume.parsedData?.location || '',
        job.location || '',
        job.locationType
    );

    // 4. Weighted Overall Score
    // Skills (50%) + Experience (30%) + Education (10%) + Location (10%)
    let overall = Math.round(
        (skillResult.score * 0.50) + 
        (expScore * 0.30) + 
        (eduScore * 0.10) + 
        (locScore * 0.10)
    );

    // HARD PENALTY: Prevent jobs from artificially matching just because of Exp/Edu
    if (job.structuredData?.required_skills?.length > 0 && skillResult.score === 0) {
        overall = Math.min(overall, 20); // Clamp to max 20% if absolutely ZERO skills match
    } else if (skillResult.score < 30) {
        overall = Math.min(overall, 45); // Clamp to max 45% if skill match is very weak
    }

    // 5. Generate AI Reasoning (ONLY if not skipped and not already in cache)
    let reasoning = cached?.reasoning || "";
    if (!options.skipAI && !reasoning) {
        try {
            reasoning = await generateMatchReasoning(resume, job, {
                overall,
                skillScore: skillResult.score,
                expScore,
                eduScore,
            });
        } catch (err) {
            reasoning = "Match based on skills and experience criteria.";
        }
    }

    // 6. Save and Return (Update if exists, else create)
    if (cached) {
        cached.overallScore = overall;
        cached.breakdown = {
            skillScore:      skillResult.score,
            experienceScore: expScore,
            educationScore:  eduScore,
            locationScore:   locScore,
        };
        cached.matchedSkills = skillResult.matchedSkills;
        cached.missingSkills = skillResult.missingSkills;
        cached.partialSkills = skillResult.partialSkills;
        cached.reasoning = reasoning;
        return await cached.save();
    }

    // NEW CACHE ENTRY
    return await MatchCache.create({
        seekerId,
        resumeId,
        jobId,
        overallScore: overall,
        breakdown: {
            skillScore:      skillResult.score,
            experienceScore: expScore,
            educationScore:  eduScore,
            locationScore:   locScore,
        },
        matchedSkills: skillResult.matchedSkills,
        missingSkills: skillResult.missingSkills,
        partialSkills: skillResult.partialSkills,
        reasoning,
    });
};
