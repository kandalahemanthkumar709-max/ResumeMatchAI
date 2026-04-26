import mongoose from 'mongoose';

/**
 * JOB MODEL
 *
 * TEXT INDEXES vs REGULAR INDEXES:
 *
 * Regular index (index: true):
 *   - Speeds up exact matches and range queries
 *   - e.g., find jobs WHERE salary.min > 50000
 *   - Like a phone book sorted by last name
 *
 * Text index ($text):
 *   - Enables full-text search across string fields
 *   - Handles stemming (search "developing" finds "developer")
 *   - Handles stop words ("the", "and" are ignored)
 *   - Multiple fields can share ONE text index per collection
 *   - Like a book index that lists every significant word
 *   - Usage: Job.find({ $text: { $search: "react developer" } })
 */

const JobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters'],
        },

        company: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },

        companyLogo: {
            type: String, // URL to company logo (Cloudinary or external)
            default: '',
        },

        location: {
            type: String,
            trim: true,
            default: 'Not specified',
        },

        // Where the work happens
        locationType: {
            type: String,
            enum: ['remote', 'hybrid', 'onsite'],
            default: 'onsite',
        },

        // Raw description written by the recruiter
        description: {
            type: String,
            required: [true, 'Job description is required'],
        },

        // Raw requirements text as written by recruiter
        requirements: {
            type: String,
            default: '',
        },

        // AI-structured data extracted from description + requirements
        // This is what the matching algorithm uses — structured, machine-readable
        structuredData: {
            required_skills:     { type: [String], default: [] },
            nice_to_have_skills: { type: [String], default: [] },
            min_experience_years:{ type: Number, default: 0 },
            education_required:  { type: String, default: '' },
            responsibilities:    { type: [String], default: [] },
            seniority_level:     { type: String, default: '' }, // junior/mid/senior/lead
            key_technologies:    { type: [String], default: [] },
        },

        salary: {
            min:       { type: Number },
            max:       { type: Number },
            currency:  { type: String, default: 'USD' },
            isVisible: { type: Boolean, default: true }, // false = "Competitive salary"
        },

        jobType: {
            type: String,
            enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
            default: 'full-time',
        },

        // Recruiter who posted this job
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ['active', 'closed', 'draft'],
            default: 'active',
            index: true,
        },

        applicationCount: { type: Number, default: 0 },
        viewCount:        { type: Number, default: 0 },
        viewedByIPs:      { type: [String], default: [] },

        // Job listing auto-expires after this date
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    },
    { timestamps: true }
);

// TEXT INDEX — enables $text search on title and description
// MongoDB only allows ONE text index per collection
// Weight: title matches are 3x more important than description matches
JobSchema.index(
    { 
        title: 'text', 
        company: 'text', 
        description: 'text', 
        'structuredData.required_skills': 'text' 
    },
    { 
        weights: { 
            title: 3, 
            company: 2, 
            'structuredData.required_skills': 2,
            description: 1 
        } 
    }
);

// Compound index for common list query: active jobs sorted by newest
JobSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Job', JobSchema);
