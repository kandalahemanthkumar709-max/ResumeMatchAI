import express from 'express';
import dotenv from 'dotenv'; 
import dns from 'dns';
// Force IPv4 globally to fix Render "ENETUNREACH" issues with Gmail/Cloudinary
dns.setDefaultResultOrder('ipv4first');
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import colors from 'colors';
import helmet from 'helmet';
import sanitizeMiddleware from './middleware/sanitizeMiddleware.js';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db.js';

// Route Imports
import resumeRoutes from './routes/resumeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/job.routes.js';
import matchRoutes from './routes/matchRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import configurePassport from './config/passport.js';
import passport from 'passport';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// 1. Load environmental variables FIRST
dotenv.config();

// 2. Setup Passport Config
configurePassport();

// Connect to MongoDB
connectDB();

const app = express();

// ---------------------------------------------------------
// SECURITY & PERFORMANCE MIDDLEWARE
// ---------------------------------------------------------

// 1. HELMET: Sets various HTTP headers to help secure your app.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://www.google.com", "https://via.placeholder.com", "https://*.googleusercontent.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS - ALLOW FRONTEND TO CONNECT
app.use(cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
    credentials: true
}));

// 3. BODY PARSER
app.use(express.json({ limit: '10kb' }));

// 4. NOSQL INJECTION PROTECTION
app.use(sanitizeMiddleware);

// 5. RATE LIMITING (DISABLED FOR DEMO)
/*
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api', generalLimiter);
*/

// Middleware: Morgan
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Passport middleware
app.use(passport.initialize());

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------
app.use('/api/resumes', resumeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// ---------------------------------------------------------
// STATIC FILES & PRODUCTION DEPLOYMENT
// ---------------------------------------------------------
const rootDir = process.cwd();

if (process.env.NODE_ENV === 'production') {
    // 1. Serve static files from the React app's DIST folder
    app.use(express.static(path.join(rootDir, 'client/dist')));

    // 2. Fallback: Handle any requests that don't match the API routes
    //    Serve the React app's index.html for any unknown routes.
    app.use((req, res, next) => {
        // If the request is for an API route that doesn't exist, pass to error handler
        if (req.originalUrl.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.resolve(rootDir, 'client', 'dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}

// ERROR HANDLING
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
