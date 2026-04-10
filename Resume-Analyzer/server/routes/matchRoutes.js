import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
    getMatchesForResume,
    getMatchesForJob,
    getSingleMatch,
    createCoverLetter
} from '../controllers/matchController.js';

const router = express.Router();

// GET /api/matches/for-resume/:resumeId — Seeker looking for jobs
router.get('/for-resume/:resumeId', protect, getMatchesForResume);

// GET /api/matches/for-job/:jobId — Recruiter looking for candidates
router.get('/for-job/:jobId', protect, authorize('recruiter', 'admin'), getMatchesForJob);

// POST /api/matches/cover-letter — Generate tailored cover letter
router.post('/cover-letter', protect, createCoverLetter);

// GET /api/matches/:resumeId/:jobId — Specific match details
router.get('/:resumeId/:jobId', protect, getSingleMatch);

export default router;
