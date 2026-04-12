import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import { getOrCreateMatch } from '../services/matching.service.js';
import { generateCoverLetter } from '../services/ai.service.js';

/**
 * MATCH CONTROLLER — Orchestrates the matching logic
 */


// ─── GET /api/matches/for-resume/:resumeId ────────────────────────────────────
// Finds top matching jobs for a specific resume
export const getMatchesForResume = async (req, res, next) => {
    try {
        const { resumeId } = req.params;
        const { minScore = 0, limit = 20 } = req.query;

        // 1. Find all active jobs
        const activeJobs = await Job.find({ status: 'active' }).limit(100); // limit search space for perf

        // 2. Loop through each job and get match result (using cache where possible)
        // Note: In production with thousands of jobs, this would be computed 
        // in a worker thread or on job-post, not in the request cycle.
        const matchPromises = activeJobs.map(job => 
            getOrCreateMatch(req.user._id, resumeId, job._id).catch(() => null)
        );

        const allResults = await Promise.all(matchPromises);
        
        // 3. Filter, Sort, and Return
        const filtered = allResults
            .filter(m => m !== null && m.overallScore >= Number(minScore))
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, Number(limit));

        // Populate job details (we don't store full job in cache, just ID)
        const populated = await Promise.all(filtered.map(async (m) => {
            const result = m.toObject();
            result.job = await Job.findById(m.jobId).select('title company location locationType jobType companyLogo requirements description structuredData');
            return result;
        }));

        res.json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/matches/for-job/:jobId ──────────────────────────────────────────
// Finds top matching candidates for a specific job posting
export const getMatchesForJob = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job) {
            res.status(404);
            throw new Error('Job posting not found.');
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Access denied. You can only view candidates for jobs you have posted.');
        }

        // Find all resumes (in real app, we'd filter by role/status)
        const allResumes = await Resume.find({ status: 'parsed' }).limit(100);
        console.log(`Found ${allResumes.length} resumes for matching`);

        const matchPromises = allResumes.map(resume => 
            getOrCreateMatch(resume.userId, resume._id, jobId).catch(err => {
                console.error(`Match error for resume ${resume._id}:`, err.message);
                return null;
            })
        );

        const allResults = await Promise.all(matchPromises);
        console.log(`Successful matches: ${allResults.filter(m => m !== null).length}`);

        const filtered = allResults
            .filter(m => m !== null)
            .sort((a, b) => b.overallScore - a.overallScore);

        const populated = await Promise.all(filtered.map(async (m) => {
            const result = m.toObject();
            result.resume = await Resume.findById(m.resumeId).select('label userId originalName');
            result.job = job; // Attach the already fetched job object
            return result;
        }));

        res.json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/matches/:resumeId/:jobId ────────────────────────────────────────
export const getSingleMatch = async (req, res, next) => {
    try {
        const { resumeId, jobId } = req.params;
        
        // Find resume to get seekerId
        const resume = await Resume.findById(resumeId);
        if (!resume) throw new Error('Resume not found');

        const match = await getOrCreateMatch(resume.userId, resumeId, jobId);
        const result = match.toObject();
        result.job = await Job.findById(jobId).select('title company location locationType jobType companyLogo requirements description structuredData');
        
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/matches/cover-letter ──────────────────────────────────────────
export const createCoverLetter = async (req, res, next) => {
    try {
        const { resumeId, jobId } = req.body;

        const [resume, job] = await Promise.all([
            Resume.findById(resumeId).populate('userId', 'name'),
            Job.findById(jobId)
        ]);

        if (!resume || !job) {
            res.status(404);
            throw new Error('Resume or Job not found');
        }

        const coverLetter = await generateCoverLetter(resume, job);
        res.json({ success: true, data: coverLetter });
    } catch (error) {
        next(error);
    }
};
