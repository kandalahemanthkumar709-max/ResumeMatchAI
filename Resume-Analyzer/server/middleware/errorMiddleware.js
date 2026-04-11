import AppError from '../utils/AppError.js';
import fs from 'fs';
import path from 'path';

/**
 * GLOBAL ERROR HANDLING MIDDLEWARE
 *
 * This handles any Error (or AppError) that is passed to next(err).
 */

// Not Found Handler (404)
const notFound = (req, res, next) => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(error);
};

// Log errors to file in production
const logErrorToFile = (err) => {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const logMessage = `[${new Date().toISOString()}] ${err.stack}\n\n`;
    fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
};

// DEV ERROR RESPONSE (Full Details)
const sendErrorDev = (err, req, res) => {
    // API request details
    console.error(`❌ HTTP ERROR [${req.method} ${req.originalUrl}]`.red.bold);
    console.error(err.stack.red);

    return res.status(err.statusCode).json({
        success: false,
        status:  err.status,
        error:   err,
        message: err.message,
        stack:   err.stack
    });
};

// PROD ERROR RESPONSE (Concise but friendly)
const sendErrorProd = (err, req, res) => {
    // 1. Operational, trusted error: send message to client
    // We ALSO allow errors that have a 4xx status code to show their message
    if (err.isOperational || (err.statusCode && err.statusCode < 500)) {
        return res.status(err.statusCode).json({
            success: false,
            status:  err.status,
            message: err.message
        });
    }

    // 2. Programming or other unknown error: don't leak details
    console.error('ERROR 💥', err);
    logErrorToFile(err);

    // Send generic message
    return res.status(500).json({
        success: false,
        status:  'error',
        message: 'Something went very wrong!'
    });
};

// Main Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode) || 500;
    err.status     = err.status     || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        // Handle specific mongoose/JWT errors
        let error = { ...err, message: err.message };

        // Duplicate field — code 11000
        if (err.code === 11000) {
            const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
            const message = `Duplicate field value: ${value}. Please use another value!`;
            error = new AppError(message, 400);
        }

        // Validation Error
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            error = new AppError(message, 400);
        }

        // JWT Errors
        if (err.name === 'JsonWebTokenError') {
            error = new AppError('Invalid token. Please log in again!', 401);
        }
        if (err.name === 'TokenExpiredError') {
            error = new AppError('Your token has expired! Please log in again.', 401);
        }

        sendErrorProd(error, req, res);
    }
};

export { notFound, errorHandler };
