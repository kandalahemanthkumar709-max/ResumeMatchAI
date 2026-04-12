import Job from '../models/Job.js';
import { structureJobDescription } from '../services/ai.service.js';

/**
 * JOB CONTROLLER — Business logic for all job operations
 *
 * KEY CONCEPTS EXPLAINED:
 *
 * MongoDB find() vs aggregation:
 *   find()        → simple queries, returns documents as-is
 *   aggregate()   → pipeline of stages, can join/group/transform
 *   We use find() here since our queries are filters, not transformations.
 *
 * Pagination with skip + limit:
 *   Page 1: skip(0).limit(10)  → documents 1-10
 *   Page 2: skip(10).limit(10) → documents 11-20
 *   Page 3: skip(20).limit(10) → documents 21-30
 *   Formula: skip = (page - 1) * limit
 */

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
export const createJob = async (req, res, next) => {
    try {
        const {
            title, company, companyLogo, location, locationType,
            description, requirements, salary, jobType, expiresAt,
            education_required
        } = req.body;

        if (!title || !company || !description) {
            res.status(400);
            throw new Error('Title, company, and description are required.');
        }

        // Duplicate Prevention: Check if this recruiter already has an active job with the same title
        const existingJob = await Job.findOne({
            postedBy: req.user._id,
            title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }, // case-insensitive exact match
            status: 'active',
        });

        if (existingJob) {
            res.status(409);
            throw new Error(`You already have an active posting for "${title}". Please close or edit the existing one first.`);
        }

        // Run AI structuring (non-blocking on failure — defaults are set in service)
        console.log('🤖 AI structuring job description...');
        const structuredData = await structureJobDescription(description, title, requirements);
        
        // OVERRIDE: If recruiter provided an explicit education level, use it instead of AI inference
        if (education_required) {
            structuredData.education_required = education_required;
        }

        console.log('✅ Job structured:', structuredData.required_skills?.join(', '));

        const job = await Job.create({
            title,
            company,
            companyLogo: companyLogo || '',
            location: location || 'Remote',
            locationType: locationType || 'remote',
            description,
            requirements: requirements || '',
            structuredData,
            salary: salary || {},
            jobType: jobType || 'full-time',
            postedBy: req.user._id, // from JWT protect middleware
            expiresAt: expiresAt || undefined, // uses schema default (30 days)
        });

        res.status(201).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────
export const getAllJobs = async (req, res, next) => {
    try {
        /**
         * DYNAMIC QUERY BUILDER
         * We build the filter object based on what query params were sent.
         * Only add a condition if the user actually sent that filter.
         *
         * URL example:
         * /api/jobs?search=react developer&location=remote&type=full-time&minSalary=50000&skills=React,Node.js&page=2
         */
        const {
            search,        // full-text search string
            locationType,  // remote | hybrid | onsite
            jobType,       // full-time | part-time | contract | internship
            minSalary,     // minimum salary number
            maxSalary,     // maximum salary number
            skills,        // comma-separated: "React,Node.js,Python"
            page = 1,      // current page (default: 1)
            limit = 12,    // jobs per page (default: 12)
            sort = 'newest', // newest | oldest | salary-high | salary-low
        } = req.query;

        // Start with base filter: only show active, non-expired jobs
        const query = {
            status: 'active',
            // $gt: greater than. expiresAt must be in the future.
            expiresAt: { $gt: new Date() },
        };

        /**
         * $text search — uses our text index on title + description + skills
         * MongoDB tokenises the search string and finds documents containing those words.
         * "react developer" → finds docs with "react" OR "developer" in indexed fields.
         * Phrase search: wrap in quotes → '"react developer"' for exact phrase.
         */
        if (search) {
            // Use regex for flexible matching on Title and Company
            // This ensures that "Netflix" or "Pixel" matches even if text index is still building
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { company: searchRegex },
                { 'structuredData.required_skills': searchRegex }
            ];
        }

        /**
         * $regex — regular expression matching (for partial string matches)
         * $options: 'i' → case-insensitive
         * /remote/i matches "Remote", "REMOTE", "remote"
         * We use exact enum match for locationType since it's controlled data.
         */
        if (locationType) query.locationType = locationType;
        if (jobType)      query.jobType = jobType;

        /**
         * Salary range filter:
         * $gte: greater than or equal
         * $lte: less than or equal
         * salary.min >= minSalary means the job pays at least minSalary
         */
        if (minSalary) query['salary.min'] = { $gte: Number(minSalary) };
        if (maxSalary) query['salary.max'] = { $lte: Number(maxSalary) };

        /**
         * Skills filter — $in operator:
         * Finds jobs where required_skills array contains ANY of the requested skills.
         * "skills=React,Node.js" → split to ["React", "Node.js"]
         * $in: ["React", "Node.js"] → job must have at least one of these skills.
         */
        if (skills) {
            const skillsArray = skills.split(',').map(s => s.trim());
            query['structuredData.required_skills'] = { $in: skillsArray };
        }

        // Sort configuration
        const sortOptions = {
            newest:      { createdAt: -1 },   // -1 = descending (newest first)
            oldest:      { createdAt: 1 },    //  1 = ascending
            'salary-high': { 'salary.max': -1 },
            'salary-low':  { 'salary.min': 1 },
        };
        const sortBy = sortOptions[sort] || sortOptions.newest;

        // Pagination math
        const pageNum  = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, parseInt(limit)); // cap at 50 per page
        const skip     = (pageNum - 1) * limitNum;

        // Execute query (parallel: data + total count for pagination)
        // Promise.all runs both queries at the same time (faster than sequential)
        const [jobs, total] = await Promise.all([
            Job.find(query)
                .populate('postedBy', 'name avatar')   // join User: only name and avatar
                .sort(sortBy)
                .skip(skip)   // skip N documents (previous pages)
                .limit(limitNum)  // take only limitNum documents
                .select('-description -requirements'), // exclude large text from list view
            Job.countDocuments(query), // total matching count (for pagination UI)
        ]);

        // OPTIMIZATION: If seeker is logged in, attach match scores
        let jobsWithMatches = jobs.map(j => j.toObject());
        if (req.user && req.user.role === 'seeker') {
            try {
                const { getOrCreateMatch } = await import('../services/matching.service.js');
                const { default: Resume } = await import('../models/Resume.js');
                const defResume = await Resume.findOne({ userId: req.user._id, isDefault: true }) || await Resume.findOne({ userId: req.user._id });
                
                if (defResume) {
                    jobsWithMatches = await Promise.all(jobs.map(async (job) => {
                        const jobObj = job.toObject();
                        try {
                            const match = await getOrCreateMatch(req.user._id, defResume._id, job._id, { skipAI: true });
                            jobObj.matchScore = match.overallScore;
                        } catch (err) {
                            jobObj.matchScore = null;
                        }
                        return jobObj;
                    }));
                }
            } catch (err) {
                console.warn('Matches skipped in getAllJobs:', err.message);
            }
        }

        res.json({
            success: true,
            data: jobsWithMatches,
            pagination: {
                total,
                page:       pageNum,
                limit:      limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNext:    pageNum < Math.ceil(total / limitNum),
                hasPrev:    pageNum > 1,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 API Request: Fetching job detail for ID: [${id}]`);

        // Validate ID format before querying
        if (!id || id.length !== 24) {
            console.error(`❌ Invalid Job ID format: ${id}`);
            res.status(400);
            throw new Error('The job ID provided is invalid.');
        }

        const job = await Job.findById(id)
            .populate('postedBy', 'name avatar company email'); // recruiter info

        if (!job) {
            console.warn(`⚠️ Job not found in database for ID: ${id}`);
            res.status(404);
            throw new Error('Job listing no longer exists.');
        }

        if (job.status === 'closed') {
            console.warn(`⚠️ Attempted to access closed job: ${id}`);
            res.status(404);
            throw new Error('This job posting has been closed by the recruiter.');
        }

        // Unique View Tracking: Track by User ID instead of IP to allow testing from same machine
        const viewerId = req.user ? req.user._id.toString() : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
        
        // Atomically add to set and then sync viewCount
        const updatedJob = await Job.findByIdAndUpdate(req.params.id, { 
            $addToSet: { viewedByIPs: viewerId }
        }, { returnDocument: 'after' });
        
        // Safety check to prevent crash if updatedJob is null
        if (updatedJob && updatedJob.viewedByIPs.length > updatedJob.viewCount) {
            updatedJob.viewCount = updatedJob.viewedByIPs.length;
            await updatedJob.save();
        }

        res.json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

// ─── PATCH /api/jobs/:id ──────────────────────────────────────────────────────
export const updateJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            res.status(404);
            throw new Error('Job not found.');
        }

        // Security: only the recruiter who posted it can update it
        // .toString() needed because ObjectId !== String comparison
        if (job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('You are not authorised to edit this job.');
        }

        // If description changed, re-run AI structuring
        if (req.body.description && req.body.description !== job.description) {
            req.body.structuredData = await structureJobDescription(
                req.body.description,
                req.body.title || job.title,
                req.body.requirements || job.requirements
            );
        }

        // If explicit education update was sent outside of structuredData, move it inside
        if (req.body.education_required) {
            if (!req.body.structuredData) req.body.structuredData = { ...job.structuredData };
            req.body.structuredData.education_required = req.body.education_required;
        }

        // new: true → return updated document (not the old one)
        const updated = await Job.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // $set: only updates the provided fields
            { returnDocument: 'after', runValidators: true } // use returnDocument instead of new
        );

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE /api/jobs/:id — SOFT DELETE ───────────────────────────────────────
export const deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            res.status(404);
            throw new Error('Job not found.');
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorised.');
        }

        // Soft delete: set status to 'closed' instead of removing from DB
        // This preserves application history and analytics data
        await Job.findByIdAndUpdate(req.params.id, { status: 'closed' });

        res.json({ success: true, message: 'Job closed successfully.' });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/jobs/recruiter/my-jobs ─────────────────────────────────────────
export const getMyJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({ postedBy: req.user._id })
            .sort({ createdAt: -1 })
            .select('title status description applicationCount viewCount createdAt locationType jobType');

        // ── Date boundaries for trend calculations ──
        const now = new Date();

        // This month vs last month
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const jobsThisMonth = jobs.filter(j => new Date(j.createdAt) >= thisMonthStart).length;
        const jobsLastMonth = jobs.filter(j => {
            const d = new Date(j.createdAt);
            return d >= lastMonthStart && d < thisMonthStart;
        }).length;

        // Today's date boundary
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // We need today's applications — query Application model
        let todayApps = 0;
        try {
            const Application = (await import('../models/Application.js')).default;
            todayApps = await Application.countDocuments({
                jobId: { $in: jobs.map(j => j._id) },
                appliedAt: { $gte: todayStart }
            });
        } catch (e) {
            todayApps = 0;
        }

        // View growth: compare jobs created this week vs last week
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const viewsThisWeek = jobs
            .filter(j => new Date(j.createdAt) >= weekAgo)
            .reduce((sum, j) => sum + j.viewCount, 0);
        const viewsLastWeek = jobs
            .filter(j => {
                const d = new Date(j.createdAt);
                return d >= twoWeeksAgo && d < weekAgo;
            })
            .reduce((sum, j) => sum + j.viewCount, 0);

        const viewGrowth = viewsLastWeek > 0
            ? Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100)
            : (viewsThisWeek > 0 ? 100 : 0);

        const stats = {
            total:        jobs.length,
            active:       jobs.filter(j => j.status === 'active').length,
            closed:       jobs.filter(j => j.status === 'closed').length,
            totalViews:   jobs.reduce((sum, j) => sum + j.viewCount, 0),
            totalApps:    jobs.reduce((sum, j) => sum + j.applicationCount, 0),
            // Dynamic trends
            trends: {
                postingsThisMonth: jobsThisMonth,
                postingsDiff: jobsThisMonth - jobsLastMonth,
                todayApps: todayApps,
                viewGrowth: viewGrowth,
            }
        };

        res.json({ success: true, data: jobs, stats });
    } catch (error) {
        next(error);
    }
};
