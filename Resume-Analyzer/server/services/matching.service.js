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
    'python': ['py', 'python3', 'pythonscript'],
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'node.js': ['nodejs', 'node'],
    'react': ['reactjs', 'react.js', 'react native'],
    'machine learning': ['ml', 'statistical modeling', 'predictive modeling'],
    'deep learning': ['dl', 'neural networks', 'cnn', 'rnn'],
    'artificial intelligence': ['ai', 'agentic ai', 'artificial-intelligence'],
    'natural language processing': ['nlp', 'llm', 'large language models', 'transformers', 'bert', 'gpt'],
    'sql': ['postgresql', 'mysql', 'mssql', 'sqlite', 'relational database'],
    'nosql': ['mongodb', 'cassandra', 'redis', 'dynamodb'],
    'cloud': ['aws', 'gcp', 'azure', 'amazon web services', 'google cloud'],
    'docker': ['containerization', 'kubernetes', 'k8s', 'containers'],
    'pytorch': ['torch', 'torchvision', 'torchaudio'],
    'tensorflow': ['tf', 'keras'],
    'rest apis': ['restful', 'api design', 'json apis'],
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

        // Check synonyms
        for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
            const allInGroup = [canonical, ...synonyms].map(clean);
            if (allInGroup.includes(cleanReq)) {
                if (resumeList.some(rs => allInGroup.includes(rs))) {
                    return 'exact'; 
                }
            }
        }

        // Partial match logic needs to be VERY careful to avoid hallucinations (e.g., 'ai' matching 'email')
        // We only allow partial match if one string is at least 4 chars long, OR it's a dedicated word boundary match
        const partial = resumeSkills.find(rs => {
            const cRs = clean(rs);
            // Ignore very short strings completely for partial matching to avoid hallucinating
            if (cRs.length <= 3 || cleanReq.length <= 3) return false;
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
    if (!jobRequired || jobRequired.toLowerCase().includes('not specified')) return 100;

    const rankings = { 'high school': 1, 'associate': 2, 'bachelor': 3, 'master': 4, 'phd': 5 };
    
    // Find highest degree in resume
    let highestRank = 0;
    resumeEdu.forEach(edu => {
        const degree = (edu.degree || '').toLowerCase();
        Object.keys(rankings).forEach(key => {
            if (degree.includes(key) && rankings[key] > highestRank) {
                highestRank = rankings[key];
            }
        });
    });

    // Find ranking of requirement
    let reqRank = 0;
    const cleanReq = jobRequired.toLowerCase();
    Object.keys(rankings).forEach(key => {
        if (cleanReq.includes(key)) reqRank = rankings[key];
    });

    if (highestRank >= reqRank) return 100;
    if (highestRank === reqRank - 1) return 60; // One level below
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
export const getOrCreateMatch = async (seekerId, resumeId, jobId) => {
    // 1. Check Cache
    const cached = await MatchCache.findOne({ seekerId, resumeId, jobId });
    if (cached) return cached;

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

    // 5. Generate AI Reasoning (async, don't block saving metadata)
    let reasoning = "";
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

    // 6. Save and Return
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
