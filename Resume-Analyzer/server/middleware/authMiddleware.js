import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * PROTECT Middleware: This acts like a bouncer at a club.
 * It checks for a valid "Token" in the request headers. 
 * If it's missing, expired, or faked, the request is REJECTED.
 */

const protect = async (req, res, next) => {
    let token;

    // JWT is usually sent in the Authorization header like: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Split "Bearer <token>" to get just the <token> part
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using our JWT_SECRET (from .env)
            // It will return an object with the user ID!
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database and ATTACH it to the request object!
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ message: 'User not found. Please log in again.' });
            }

            req.user = user;
            return next(); // Move to the actual logic!
        } catch (error) {
            console.error(error);
            // Handle specific JWT errors separately
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token Expired. Please log in again.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid Token. Authentication failed.' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
}

/**
 * OPTIONAL AUTH Middleware: Similar to protect, but allows unauthenticated
 * requests to proceed. Helpful for public routes that want to optionally track logged in users.
 */
const optionalAuth = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
            }
        } catch (error) {
            // Ignore errors for optional auth
        }
    }
    next();
};

/**
 * AUTHORIZE Middleware: Handlers role-based permissions!
 * Example: Only "Recruiters" can delete jobs!
 * Usage: router.delete('/:id', protect, authorize('recruiter'), deleteJob);
 */

const authorize = (...roles) => {
    return (req, res, next) => {
        // If the logged-in user's role is not in the allowed roles list, reject!
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route.`
            });
        }
        next();
    }
}

export { protect, authorize, optionalAuth };
