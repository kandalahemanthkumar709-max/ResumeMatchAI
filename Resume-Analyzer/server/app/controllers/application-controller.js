import Application from '../models/application-model.js';
import Job from '../models/job-model.js';
import Notification from '../models/notification-model.js';
import { queueEmail, sendRecruiterEmail } from '../../services/email.service.js';

// @route   POST /api/applications
// @desc    Apply to a specific job
export const applyToJob = async (req, res, next) => {
    try {
        const { jobId, resumeId, coverLetter } = req.body;

        // 1. Check if job exists and is active
        const job = await Job.findById(jobId).populate('postedBy', '_id email name');
        if (!job || job.status !== 'active') {
            res.status(400);
            throw new Error('This job is no longer accepting applications.');
        }

        // 2. Check if already exists to allow updates (instead of strict 11000 error)
        const existingApp = await Application.findOne({ seekerId: req.user._id, jobId });
        
        if (existingApp) {
            const hadCoverLetter = !!existingApp.coverLetter;
            existingApp.coverLetter = coverLetter || existingApp.coverLetter;
            if (existingApp.status === 'withdrawn') existingApp.status = 'applied';
            await existingApp.save();

            // Notify + Email recruiter if a new cover letter was just added
            if (coverLetter && !hadCoverLetter) {
                await Notification.create({
                    userId: job.postedBy._id,
                    message: `📝 ${req.user.name} added a cover letter to their application for "${job.title}".`,
                    link: `/recruiter/jobs/${job._id}/candidates`
                });

                // Seeker Bell Notification
                await Notification.create({
                    userId: req.user._id,
                    message: `✅ Your cover letter for "${job.title}" has been added.`,
                    link: '/tracker'
                });

                // Send recruiter email
                sendRecruiterEmail({
                    to: job.postedBy.email,
                    recruiterName: job.postedBy.name,
                    seekerName: req.user.name,
                    jobTitle: job.title,
                    event: 'cover_letter_added',
                    coverLetter
                }).catch(err => console.error('Recruiter email failed:', err.message));

                // Send seeker email confirmation (replyTo recruiter so seeker can reply directly)
                queueEmail({
                    to: req.user.email,
                    name: req.user.name,
                    jobTitle: job.title,
                    status: 'applied',
                    note: 'Your cover letter has been successfully attached to your application.',
                    replyTo: job.postedBy.email
                });
            }

            return res.json({ success: true, message: 'Application updated successfully.', data: existingApp });
        }

        // 3. Create new application
        const application = await Application.create({
            seekerId: req.user._id,
            jobId,
            resumeId,
            coverLetter,
            status: 'applied'
        });

        // 3. Increment job metrics and ensure application counts as a view
        // Using findByIdAndUpdate with $addToSet ensures unique view tracking and is atomic!
        await Job.findByIdAndUpdate(jobId, {
            $inc: { applicationCount: 1 },
            $addToSet: { viewedByIPs: req.user._id.toString() }
        });

        // We also need to manually sync the viewCount if the user was new
        // A more robust way is to re-fetch or use a post-save hook, 
        // but for now let's just ensure viewCount stays consistent
        const updatedJob = await Job.findById(jobId);
        if (updatedJob.viewedByIPs.length > updatedJob.viewCount) {
             updatedJob.viewCount = updatedJob.viewedByIPs.length;
             await updatedJob.save();
        }

        // 4. Notify + Email recruiter about new application
        console.log(`📣 [App] Triggering notifications for applicant: ${req.user.name}`);
        
        await Notification.create({
            userId: job.postedBy._id,
            message: `🚀 ${req.user.name} applied for "${job.title}"${coverLetter ? ' with a cover letter' : ''}.`,
            link: `/recruiter/jobs/${jobId}/candidates`
        });

        // 4b. Notify Seeker success via bell
        await Notification.create({
            userId: req.user._id,
            message: `🎉 Successfully applied for "${job.title}" at ${job.company}!`,
            link: '/tracker'
        });

        // Send recruiter email (non-blocking)
        if (job.postedBy && job.postedBy.email) {
            console.log(`✉️ [App] Sending recruiter email to: ${job.postedBy.email}`);
            sendRecruiterEmail({
                to: job.postedBy.email,
                recruiterName: job.postedBy.name || 'Recruiter',
                seekerName: req.user.name || 'A candidate',
                jobTitle: job.title,
                event: 'new_application',
                coverLetter: coverLetter
            }).catch(err => console.error('❌ [App] Recruiter email failed:', err.message));
        }

        // 5. Notify & Email seeker (replyTo recruiter so seeker can reply directly)
        console.log(`✉️ [App] Sending seeker confirmation to: ${req.user.email}`);
        queueEmail({
            to: req.user.email,
            name: req.user.name,
            jobTitle: job.title,
            status: 'applied',
            replyTo: job.postedBy?.email
        }).catch(err => console.error('❌ [App] Seeker email failed:', err.message));

        res.status(201).json({ success: true, data: application });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            return next(new Error('You have already applied for this position.'));
        }
        next(error);
    }
};

// @route   PATCH /api/applications/:id/status
// @desc    Update application status (Recruiter only)
export const updateApplicationStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const application = await Application.findById(req.params.id).populate('jobId seekerId');

        if (!application) {
            res.status(404);
            throw new Error('Application not found.');
        }

        // Only job owner can update
        if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Unauthorized to update this application.');
        }

        application.status = status;
        application.notes = notes || application.notes;
        await application.save();

        // Notify seeker with status update AND the recruiter's message
        await Notification.create({
            userId: application.seekerId._id,
            message: `Your application for "${application.jobId.title}" has been moved to "${status}". ${notes ? `Recruiter note: "${notes}"` : ''}`,
            link: `/tracker`
        });

        // Attach recruiter email as replyTo so seeker can respond to the notification email
        const recruiter = await Job.findById(application.jobId._id).populate('postedBy', 'email');
        queueEmail({
            to: application.seekerId.email,
            name: application.seekerId.name,
            jobTitle: application.jobId.title,
            status,
            note: notes,
            replyTo: recruiter?.postedBy?.email || req.user.email
        });

        res.json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/applications/my-applications
// @desc    Get all applications for the logged in seeker
export const getMyApplications = async (req, res, next) => {
    try {
        const apps = await Application.find({ seekerId: req.user._id })
            .populate({
                path: 'jobId',
                select: 'title company location locationType companyLogo postedBy',
                populate: {
                    path: 'postedBy',
                    select: 'name email'
                }
            })
            .sort('-appliedAt');

        res.json({ success: true, data: apps });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/applications/job/:jobId
// @desc    Get all applications for a specific job (Recruiter)
export const getJobApplications = async (req, res, next) => {
    try {
        // 1. Verify job exists and belongs to this recruiter
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            res.status(404);
            throw new Error('Job not found.');
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Access denied. You can only view candidates for jobs you have posted.');
        }

        // 2. Fetch applications
        const apps = await Application.find({ jobId: req.params.jobId })
            .populate('seekerId', 'name email avatar')
            .populate('resumeId', 'label')
            .sort('-appliedAt');

        res.json({ success: true, data: apps });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/applications/:id
// @desc    Get single application by ID
export const getApplicationById = async (req, res, next) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('jobId')
            .populate('seekerId', 'name email avatar')
            .populate('resumeId');
            
        if (!application) {
            res.status(404);
            throw new Error('Application not found.');
        }

        res.json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/applications/:id/withdraw
// @desc    Withdraw application (Seeker only)
export const withdrawApplication = async (req, res, next) => {
    try {
        const application = await Application.findById(req.params.id).populate('jobId');

        if (!application) {
            res.status(404);
            throw new Error('Application not found.');
        }

        // Ensure it's the seeker's own application
        if (application.seekerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Unauthorized.');
        }

        application.status = 'withdrawn';
        await application.save();

        // Notify + Email recruiter about withdrawal
        try {
            // Recruiter Bell
            await Notification.create({
                userId: application.jobId.postedBy,
                message: `${req.user.name} has withdrawn their application for "${application.jobId.title}".`,
                link: `/recruiter/jobs/${application.jobId._id}/candidates`
            });

            // Seeker Bell
            await Notification.create({
                userId: req.user._id,
                message: `📢 You have withdrawn your application for "${application.jobId.title}".`,
                link: '/tracker'
            });

            // Recruiter Email
            sendRecruiterEmail({
                to: application.jobId.postedBy?.email,
                recruiterName: '',
                seekerName: req.user.name,
                jobTitle: application.jobId.title,
                event: 'withdrawal'
            }).catch(err => console.error('Recruiter withdrawal email failed:', err.message));

            // Seeker Email
            queueEmail({
                to: req.user.email,
                name: req.user.name,
                jobTitle: application.jobId.title,
                status: 'withdrawn'
            });
        } catch (e) { console.error('Notification failed', e); }

        res.json({ success: true, message: 'Application withdrawn.' });
    } catch (error) {
        next(error);
    }
};

