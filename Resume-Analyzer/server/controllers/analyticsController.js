import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import MatchCache from '../models/MatchCache.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// ─── SEEKER ANALYTICS (Aggregations) ──────────────────────────────────────────

/**
 * GET /api/analytics/seeker
 * Fetches dashboard data for the job seeker.
 */
export const getSeekerAnalytics = catchAsync(async (req, res, next) => {
    const seekerId = req.user._id;

    // 2. Fetch from DB (Cache Miss)
    // Total Resumes & Avg ATS Score
    const resumeStats = await Resume.aggregate([
        { $match: { userId: seekerId, status: 'parsed' } },
        {
            $group: {
                _id: null,
                totalResumes: { $sum: 1 },
                avgAtsScore: { $avg: '$atsScore' }
            }
        }
    ]);

    // 2. Application status breakdown
    const applicationStats = await Application.aggregate([
        { $match: { seekerId: seekerId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // 3. Match score distribution (from MatchCache)
    const matchDistribution = await MatchCache.aggregate([
        { $match: { seekerId: seekerId } },
        {
            $bucket: {
                groupBy: '$overallScore',
                boundaries: [0, 50, 75, 90, 101],
                default: 'Other',
                output: {
                    count: { $sum: 1 }
                }
            }
        }
    ]);

    // 4. Top missing skills (Unlocking 'MissingSkills' array)
    // $unwind: creates a new document for every element in the array
    const missingSkillsStats = await Resume.aggregate([
        { $match: { userId: seekerId, status: 'parsed' } },
        { $unwind: '$parsedData.missingSkills' },
        {
            $group: {
                _id: '$parsedData.missingSkills',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // 5. Applications over time (Last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const appsOverTime = await Application.aggregate([
        { 
            $match: { 
                seekerId: seekerId,
                appliedAt: { $gte: eightWeeksAgo }
            } 
        },
        {
            $group: {
                _id: { $week: '$appliedAt' },
                date: { $min: '$appliedAt' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    const dashboardData = {
        resumes: resumeStats[0] || { totalResumes: 0, avgAtsScore: 0 },
        applications: applicationStats,
        matches: matchDistribution,
        missingSkills: missingSkillsStats,
        timeline: appsOverTime
    };


    res.json({
        success: true,
        data: dashboardData
    });
});

// ─── RECRUITER ANALYTICS (Aggregations) ───────────────────────────────────────

/**
 * GET /api/analytics/recruiter
 * Fetches dashboard data for the recruiter.
 */
export const getRecruiterAnalytics = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'recruiter') {
        return next(new AppError('Only recruiters can access these analytics.', 403));
    }

    const recruiterId = req.user._id;

    // 1. Job Stats (Active vs Closed)
    const jobStats = await Job.aggregate([
        { $match: { postedBy: recruiterId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // 2. Total applications across all jobs
    // We use $lookup to join Job and Application collections
    const applicationMetrics = await Job.aggregate([
        { $match: { postedBy: recruiterId } },
        {
            $lookup: {
                from: 'applications',
                localField: '_id',
                foreignField: 'jobId',
                as: 'apps'
            }
        },
        { $unwind: '$apps' },
        {
            $group: {
                _id: null,
                totalApps: { $sum: 1 },
                avgMatchScore: { $avg: '$apps.matchScore' } // Ensure MatchScore exists in Application model
            }
        }
    ]);

    // 3. Top performing jobs (by application count)
    const topJobs = await Job.find({ postedBy: recruiterId })
        .sort('-applicationCount')
        .limit(5)
        .select('title applicationCount viewCount');

    // 4. Application funnel (Funnel conversion)
    const funnel = await Application.aggregate([
        // First find jobs owned by this recruiter
        {
            $lookup: {
                from: 'jobs',
                localField: 'jobId',
                foreignField: '_id',
                as: 'job'
            }
        },
        { $unwind: '$job' },
        { $match: { 'job.postedBy': recruiterId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const dashboardData = {
        jobs: jobStats,
        metrics: applicationMetrics[0] || { totalApps: 0, avgMatchScore: 0 },
        topJobs,
        funnel
    };


    res.json({
        success: true,
        data: dashboardData
    });
});
