import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
    applyToJob, 
    updateApplicationStatus, 
    getMyApplications, 
    getJobApplications,
    getApplicationById,
    withdrawApplication
} from '../controllers/applicationController.js';

const router = express.Router();

// Seeker routes
router.post('/', protect, applyToJob);
router.get('/my-applications', protect, getMyApplications);
router.patch('/:id/withdraw', protect, withdrawApplication);

// Recruiter routes
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), getJobApplications);
router.get('/:id', protect, authorize('recruiter', 'admin'), getApplicationById);
router.patch('/:id/status', protect, authorize('recruiter', 'admin'), updateApplicationStatus);

export default router;
