import mongoose from 'mongoose';

/**
 * MATCH CACHE MODEL
 * 
 * WHY CACHE MATCH RESULTS?
 * 1. Performance: Matching involves complex math and string comparisons across potentially thousands of jobs.
 * 2. Cost: If we use AI to generate reasoning (like GPT-4o or Gemini), calling an LLM every time a user 
 *    refreshes their "Matches" page would cost a fortune.
 * 3. User Experience: Instant loading of scores vs. waiting 5-10 seconds for AI processing.
 * 
 * COMPOUND INDEX ({resumeId: 1, jobId: 1}):
 * This is a unique index across TWO fields. It ensures that we only ever have ONE cached result 
 * for a specific user-job combination. If we try to save a second one, MongoDB will reject it.
 * 
 * TTL INDEX (generatedAt: 1, expireAfterSeconds: 604800):
 * TTL = "Time To Live". MongoDB will automatically DELETE the document 7 days after it's created.
 * This ensures our cache doesn't grow forever and that scores are occasionally recalculated 
 * (since job seekers might update their resumes or recruiters might update job details).
 */

const MatchCacheSchema = new mongoose.Schema(
    {
        seekerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume',
            required: true,
            index: true,
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
            index: true,
        },
        overallScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        breakdown: {
            skillScore:      { type: Number, default: 0 },
            experienceScore: { type: Number, default: 0 },
            educationScore:  { type: Number, default: 0 },
            locationScore:   { type: Number, default: 0 },
        },
        matchedSkills: { type: [String], default: [] },
        missingSkills: { type: [String], default: [] },
        partialSkills: { type: [String], default: [] },
        
        // AI-generated explanation of the match
        reasoning: {
            type: String,
            default: '',
        },

        generatedAt: {
            type: Date,
            default: Date.now,
            index: { expires: '7d' }, // 7 days TTL index
        },
    },
    { timestamps: true }
);

// COMPOUND UNIQUE INDEX: One cache entry per resume-job pair
MatchCacheSchema.index({ resumeId: 1, jobId: 1 }, { unique: true });

export default mongoose.model('MatchCache', MatchCacheSchema);
