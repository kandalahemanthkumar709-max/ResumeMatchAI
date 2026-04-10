import express from 'express';
import upload from '../config/multer.js';
import { protect } from '../middleware/authMiddleware.js';
import {
    uploadResume,
    getAllResumes,
    getResumeById,
    deleteResume,
    setDefaultResume,
    reanalyzeResume,
} from '../controllers/resumeController.js';

const router = express.Router();

/**
 * All resume routes are protected — user must be logged in (JWT required).
 *
 * The protect middleware runs BEFORE our controller.
 * It verifies the JWT token and attaches req.user to the request.
 *
 * upload.single('resume') → multer middleware that:
 *   1. Reads the multipart/form-data body
 *   2. Finds the field named 'resume'
 *   3. Puts the file in memory as req.file.buffer
 */

// POST   /api/resumes/upload          → Upload new resume
router.post('/upload', protect, upload.single('resume'), uploadResume);

// GET    /api/resumes                 → Get all resumes for logged-in user
router.get('/', protect, getAllResumes);

// GET    /api/resumes/:id             → Get single resume with full data
router.get('/:id', protect, getResumeById);

// DELETE /api/resumes/:id             → Delete resume + remove from Cloudinary
router.delete('/:id', protect, deleteResume);

// PATCH  /api/resumes/:id/set-default → Mark as default resume
router.patch('/:id/set-default', protect, setDefaultResume);

// POST   /api/resumes/:id/analyze     → Re-run AI analysis
router.post('/:id/analyze', protect, reanalyzeResume);

export default router;
