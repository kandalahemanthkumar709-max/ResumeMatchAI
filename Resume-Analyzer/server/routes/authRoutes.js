import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { check } from 'express-validator';
import { registerUser, loginUser, getMe, updateProfile, sendTestEmail } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * AUTH Routes: The Map of security
 * We'll define which URL does what (Register, Login, Google).
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

// ---------------------------------------------------------
// GOOGLE OAUTH ROUTES
// ---------------------------------------------------------

// @route   GET /api/auth/google
// @desc    Start Google Login (Sends user to Google's site)
// scope: ['profile', 'email'] - We ask Google for their name/pic/email
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth Callback (User returns from Google)
router.get('/google/callback', passport.authenticate('google', { 
    session: false, // We're using JWT, so no need for server "sessions"
    failureRedirect: '/login' 
}), (req, res) => {
    // 1. Generate a JWT for this user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    // 2. SMART REDIRECT: Send user to the correct dashboard based on their role
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const dynamicPath = req.user.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard';
    
    res.redirect(`${baseUrl}${dynamicPath}?token=${token}`);
});

export default router;
