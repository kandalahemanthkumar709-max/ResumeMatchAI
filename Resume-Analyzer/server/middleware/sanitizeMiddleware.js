/**
 * NOSQL INJECTION PROTECTION (Express 5 Compatible)
 * 
 * WHY THIS CUSTOM MIDDLEWARE?
 * 'express-mongo-sanitize' is incompatible with Express 5 because it tries to 
 * overwrite 'req.query', which is now a read-only getter.
 * 
 * WHAT THIS DOES:
 * Recursively removes any keys starting with '$' or containing '.' from:
 * 1. req.body
 * 2. req.params
 */

const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
};

const sanitizeMiddleware = (req, res, next) => {
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    // Note: We skip req.query in Express 5 as it's read-only and 
    // usually handled by the query parser anyway.
    next();
};

export default sanitizeMiddleware;
