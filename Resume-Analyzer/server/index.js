import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import dotenv from 'dotenv'; 
dotenv.config({ quiet: true });
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import colors from 'colors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Controller Imports
import * as userCtrl from './app/controllers/user-controller.js';
import * as jobCtrl from './app/controllers/job-controller.js';
import * as resumeCtrl from './app/controllers/resume-controller.js';
import * as applicationCtrl from './app/controllers/application-controller.js';
import * as matchCtrl from './app/controllers/match-controller.js';
import * as analyticsCtrl from './app/controllers/analytics-controller.js';

// Middleware Imports
import { protect, optionalAuth } from './app/middlewares/user-autentication.js';
import { authorize } from './app/middlewares/authorize.js';
import sanitizeMiddleware from './app/middlewares/sanitize-middleware.js';
import { errorHandler, notFound } from './app/middlewares/error-middleware.js';
import upload from './config/multer.js';

// Models
import Notification from './app/models/notification-model.js';

// Configure Database
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://via.placeholder.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(sanitizeMiddleware);
app.use(morgan('dev'));

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', generalLimiter);

// ---------------------------------------------------------
// User Routes
// ---------------------------------------------------------
app.post('/api/auth/register', userCtrl.register);
app.post('/api/auth/login', userCtrl.login);
app.get('/api/auth/account', protect, userCtrl.account);
app.patch('/api/auth/profile', protect, userCtrl.updateProfile);
app.post('/api/auth/test-email', protect, userCtrl.sendTestEmail);
app.patch('/api/auth/set-role', protect, userCtrl.setRole);

// ---------------------------------------------------------
// Job Routes
// ---------------------------------------------------------
app.get('/api/jobs/recruiter/my-jobs', protect, authorize('recruiter', 'admin'), jobCtrl.getMyJobs);
app.get('/api/jobs', optionalAuth, jobCtrl.getAllJobs);
app.get('/api/jobs/:id', optionalAuth, jobCtrl.getJobById);
app.post('/api/jobs', protect, authorize('recruiter', 'admin'), jobCtrl.createJob);
app.patch('/api/jobs/:id', protect, authorize('recruiter', 'admin'), jobCtrl.updateJob);
app.delete('/api/jobs/:id', protect, authorize('recruiter', 'admin'), jobCtrl.deleteJob);

// ---------------------------------------------------------
// Resume Routes
// ---------------------------------------------------------
app.post('/api/resumes/upload', protect, upload.single('resume'), resumeCtrl.uploadResume);
app.get('/api/resumes', protect, resumeCtrl.getAllResumes);
app.get('/api/resumes/:id', protect, resumeCtrl.getResumeById);
app.delete('/api/resumes/:id', protect, resumeCtrl.deleteResume);
app.patch('/api/resumes/:id/set-default', protect, resumeCtrl.setDefaultResume);
app.post('/api/resumes/:id/analyze', protect, resumeCtrl.reanalyzeResume);

// ---------------------------------------------------------
// Application Routes
// ---------------------------------------------------------
app.post('/api/applications', protect, applicationCtrl.applyToJob);
app.get('/api/applications/my-applications', protect, applicationCtrl.getMyApplications);
app.patch('/api/applications/:id/withdraw', protect, applicationCtrl.withdrawApplication);
app.get('/api/applications/job/:jobId', protect, authorize('recruiter', 'admin'), applicationCtrl.getJobApplications);
app.get('/api/applications/:id', protect, authorize('recruiter', 'admin'), applicationCtrl.getApplicationById);
app.patch('/api/applications/:id/status', protect, authorize('recruiter', 'admin'), applicationCtrl.updateApplicationStatus);

// ---------------------------------------------------------
// Match Routes
// ---------------------------------------------------------
app.get('/api/matches/for-resume/:resumeId', protect, matchCtrl.getMatchesForResume);
app.get('/api/matches/for-job/:jobId', protect, authorize('recruiter', 'admin'), matchCtrl.getMatchesForJob);
app.post('/api/matches/cover-letter', protect, matchCtrl.createCoverLetter);
app.get('/api/matches/:resumeId/:jobId', protect, matchCtrl.getSingleMatch);

// ---------------------------------------------------------
// Analytics Routes
// ---------------------------------------------------------
app.get('/api/analytics/seeker', protect, analyticsCtrl.getSeekerAnalytics);
app.get('/api/analytics/recruiter', protect, analyticsCtrl.getRecruiterAnalytics);

// ---------------------------------------------------------
// Notification Routes
// ---------------------------------------------------------
app.get('/api/notifications', protect, async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id }).sort('-createdAt').limit(10);
    res.json(notifications);
});
app.patch('/api/notifications/mark-all-read', protect, async (req, res) => {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
});

// ---------------------------------------------------------
// Server Static Files
// ---------------------------------------------------------
const currentDir = process.cwd();
// If we are running inside the 'server' directory, we need to go up one level to find 'client'
const clientBuildPath = currentDir.endsWith('server') 
    ? path.join(currentDir, '..', 'client', 'dist') 
    : path.join(currentDir, 'client', 'dist');

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(clientBuildPath));
    app.use((req, res, next) => {
        if (req.originalUrl.startsWith('/api')) return next();
        res.sendFile(path.resolve(clientBuildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.json({ message: "Welcome to ResumeMatch AI API" }));
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`.yellow.bold);
});
