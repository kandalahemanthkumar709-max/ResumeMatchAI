import mongoose from 'mongoose';

/**
 * APPLICATION MODEL
 * 
 * COMPOUND INDEX ({seekerId: 1, jobId: 1}):
 * Prevents "Spam Applications". One user can only apply to one specific job once.
 * MongoDB will throw an error if this unique constraint is violated.
 * 
 * STATUS HISTORY:
 * Why track full history? 
 * 1. Auditing: See when an application moved from 'Applied' to 'Rejected'.
 * 2. Analytics: Calculate "Time to Hire" or "Average stay in Screening".
 * 3. Transparency: Show the seeker exactly when their status was updated.
 */

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'],
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        default: ''
    }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
    seekerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true
    },
    coverLetter: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'],
        default: 'applied'
    },
    notes: {
        type: String, // Recruiter's internal notes
        default: ''
    },
    matchScore: {
        type: Number,
        required: [true, 'Match score is required'],
        default: 0
    },
    statusHistory: [statusHistorySchema],
    appliedAt: {
        type: Date,
        default: Date.now
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// COMPOUND INDEX: One application per job per user
applicationSchema.index({ seekerId: 1, jobId: 1 }, { unique: true });

/**
 * PRE-SAVE MIDDLEWARE:
 * Every time the status field is changed, we manually push the change to 
 * the statusHistory array so we don't have to do it in the controller.
 */
applicationSchema.pre('save', async function() {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            note: this.notes || `Moved to ${this.status} stage.`
        });
        this.statusUpdatedAt = new Date();
    }
});

export default mongoose.model('Application', applicationSchema);
