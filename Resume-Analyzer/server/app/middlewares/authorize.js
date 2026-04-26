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

export { authorize };
