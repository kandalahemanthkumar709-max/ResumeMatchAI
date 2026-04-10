import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js';
import {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    getMyJobs,
} from '../controllers/job.controller.js';

const router = express.Router();

/**
 * JOB ROUTES
 *
 * Middleware chain: protect → authorize → controller
 *   protect:   verifies JWT token, attaches req.user
 *   authorize: checks if req.user.role is in the allowed roles array
 *
 * Route order matters!
 * '/recruiter/my-jobs' must be defined BEFORE '/:id'
 * otherwise Express matches 'recruiter' as the :id parameter.
 */

// ─── RECRUITER ONLY routes ──────────────────────────────────────────────────
router.get('/recruiter/my-jobs', protect, authorize('recruiter', 'admin'), getMyJobs);

// ─── PUBLIC routes (must be after specific recruiter routes) ──────────────────
router.get('/', optionalAuth, getAllJobs);            // GET  /api/jobs
router.get('/:id', optionalAuth, getJobById);        // GET  /api/jobs/:id

// (Protected actions like Create/Update/Delete)
router.post('/',     protect, authorize('recruiter', 'admin'), createJob);  // POST   /api/jobs
router.patch('/:id', protect, authorize('recruiter', 'admin'), updateJob);  // PATCH  /api/jobs/:id
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob); // DELETE /api/jobs/:id

export default router;
