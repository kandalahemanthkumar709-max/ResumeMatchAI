import express from 'express';
import { check } from 'express-validator';
import { registerUser, loginUser, getMe, updateProfile, sendTestEmail, setRole } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * AUTH Routes: The Map of security
 * We'll define which URL does what (Register, Login).
 */

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (with validation)
// check('field', 'error message').not().isEmpty() - Ensures the field is present
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role must be Seeker or Recruiter').isIn(['seeker', 'recruiter']),
], registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
], loginUser);

// @route   GET /api/auth/me
// @desc    Get current user (must be logged in)
// protect: ensures they have a valid JWT!
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/test-email', protect, sendTestEmail);
router.patch('/set-role', protect, setRole);

export default router;
