/**
 * CUSTOM ERROR CLASS
 * 
 * Why? 
 * Standard Error objects only have a message. 
 * We need:
 * 1. statusCode (404, 401, 500)
 * 2. status (fail vs error)
 * 3. isOperational (true if we predicted this error, false if it's a bug like a typo)
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        // 4xx errors are 'fail', 5xx are 'error'
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // CAPTURE STACK TRACE:
        // Shows exactly which file and line the error happened on —
        // but we exclude this constructor from the trace.
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
