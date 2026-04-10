import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getSeekerAnalytics, getRecruiterAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * All analytics routes are PROTECTED
 * We check req.user to determine which data to show.
 */

// GET /api/analytics/seeker
router.get('/seeker', protect, getSeekerAnalytics);

// GET /api/analytics/recruiter
router.get('/recruiter', protect, getRecruiterAnalytics);

export default router;
