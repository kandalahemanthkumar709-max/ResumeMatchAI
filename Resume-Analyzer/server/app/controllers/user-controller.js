import User from '../models/user-model.js';
import jwt from 'jsonwebtoken';
import { userRegistrationSchema, userLoginSchema } from '../validators/user-validator.js';
import { queueEmail } from '../../services/email.service.js';

/**
 * UTILS: Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}

// @route   POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { error } = userRegistrationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ errors: error.details.map(d => d.message) });
        }
        const { name, email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('A user with that email already exists!');
        }
        const user = await User.create({ name, email, password, role: role || 'seeker' });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        next(error);
    }
}

// @route   POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const { error } = userLoginSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ errors: error.details.map(d => d.message) });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        // Case 1: No user found at all
        if (!user) {
            res.status(401);
            throw new Error('No account found with this email. Please register first.');
        }

        // Case 2: Wrong password
        if (!(await user.matchPassword(password))) {
            res.status(401);
            throw new Error('Incorrect password. Please try again.');
        }

        // Case 3: Success!
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
}

// @route   GET /api/auth/me
export const account = async (req, res, next) => {
    try {
        res.json(req.user);
    } catch (error) {
        next(error);
    }
}

// @route   PATCH /api/auth/profile
export const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
}

// @route   PATCH /api/auth/set-role
export const setRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['seeker', 'recruiter'].includes(role)) {
            res.status(400);
            throw new Error('Invalid role selected.');
        }

        const user = await User.findById(req.user._id);
        if (user) {
            user.role = role;
            await user.save();
            
            res.json({
                success: true,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
}

// @route   POST /api/auth/test-email
export const sendTestEmail = async (req, res, next) => {
    try {
        await queueEmail({
            to: req.user.email,
            name: req.user.name,
            jobTitle: 'TEST EMAIL SYSTEM',
            status: 'applied',
            note: 'Congratulations! If you are reading this, your email system is 100% correctly configured.'
        });
        res.json({ success: true, message: 'Test email sent!' });
    } catch (error) {
        next(error);
    }
}
