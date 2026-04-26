import mongoose from 'mongoose';

/**
 * RESUME MODEL — The Database Blueprint
 *
 * NESTED SCHEMAS in Mongoose:
 * Instead of one flat schema, we can define sub-schemas for complex
 * nested objects. This gives us validation and structure on nested data.
 *
 * For example, each resume has an array of "experience" objects —
 * each experience has its own fields. We define a sub-schema for that.
 */

// ─── Sub-Schema: Work Experience Entry ────────────────────────────────────────
const ExperienceSchema = new mongoose.Schema({
    company:     { type: String, trim: true },
    title:       { type: String, trim: true },   // Job title
    location:    { type: String, trim: true },
    startDate:   { type: String },
    endDate:     { type: String },               // "Present" if still working there
    current:     { type: Boolean, default: false },
    description: { type: String },              // Bullet points of responsibilities
}, { _id: false }); // _id: false → don't add a separate _id for each sub-document

// ─── Sub-Schema: Education Entry ──────────────────────────────────────────────
const EducationSchema = new mongoose.Schema({
    institution: { type: String, trim: true },
    degree:      { type: String, trim: true },
    field:       { type: String, trim: true },  // e.g. "Computer Science"
    startDate:   { type: String },
    endDate:     { type: String },
    gpa:         { type: String },
}, { _id: false });

// ─── Sub-Schema: Certification Entry ─────────────────────────────────────────
const CertificationSchema = new mongoose.Schema({
    name:      { type: String, trim: true },
    issuer:    { type: String, trim: true },
    date:      { type: String },
    expiresAt: { type: String },
    url:       { type: String },  // Link to verify cert
}, { _id: false });

// ─── Sub-Schema: Parsed AI Data ───────────────────────────────────────────────
// This stores what the AI extracted from the resume text
const ParsedDataSchema = new mongoose.Schema({
    name:    { type: String, trim: true },
    email:   { type: String, trim: true, lowercase: true },
    phone:   { type: String, trim: true },
    summary: { type: String },             // Professional summary / objective

    skills: {
        hard:  [{ type: String }],  // Technical skills: Python, React, SQL
        soft:  [{ type: String }],  // Soft skills: Leadership, Communication
        tools: [{ type: String }],  // Tools: Figma, Jira, Git, VS Code
    },

    experience:     [ExperienceSchema],      // Array of work experiences
    education:      [EducationSchema],       // Array of degrees/courses
    certifications: [CertificationSchema],   // Array of certifications
    missingSkills:  [{ type: String }],      // AI-identified gaps based on matches
}, { _id: false });

// ─── Main Resume Schema ────────────────────────────────────────────────────────
const ResumeSchema = new mongoose.Schema(
    {
        // WHO uploaded it — references the User document
        // ref: 'User' enables .populate('userId') to get full user data
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true, // WHY INDEX? → we query resumes BY userId constantly.
                         // Index = pre-built lookup table → 10-100x faster queries.
        },

        // Human-readable label like "Senior Dev Resume" or "Marketing Resume"
        label: {
            type: String,
            trim: true,
            default: 'My Resume',
        },

        // Cloudinary HTTPS URL where the file is stored
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
        },

        // Cloudinary public_id — needed to delete the file later
        cloudinaryPublicId: {
            type: String,
        },

        // Original file name the user uploaded ("john_cv.pdf")
        originalName: {
            type: String,
            trim: true,
        },

        // 'application/pdf' or 'application/vnd...docx'
        mimeType: {
            type: String,
        },

        // Raw text extracted from the PDF/DOCX by our parser service
        // This is what we send to Gemini AI for analysis
        rawText: {
            type: String,
        },

        // The structured data that Gemini AI extracted from rawText
        parsedData: {
            type: ParsedDataSchema,
            default: null,
        },

        // ATS Compatibility Score (0-100) assigned by AI
        atsScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },

        // List of ATS issues the AI found: ["Missing keywords", "No phone number"]
        atsIssues: [{ type: String }],

        // Processing state: did the AI finish parsing it?
        // 'pending' → just uploaded, not yet parsed
        // 'parsed'  → AI has finished extracting data
        // 'failed'  → AI parsing crashed
        status: {
            type: String,
            enum: ['pending', 'parsed', 'failed'],
            default: 'pending',
        },

        // Version counter — incremented each time user re-uploads
        version: {
            type: Number,
            default: 1,
        },

        // If true, this is the resume used for job applications by default
        isDefault: {
            type: Boolean,
            default: false,
            index: true, // Index: we often query WHERE userId=X AND isDefault=true
        },
    },
    {
        // timestamps: true → Mongoose auto-adds createdAt and updatedAt fields
        timestamps: true,
    }
);

// ─── Compound Index ────────────────────────────────────────────────────────────
// A compound index speeds up queries that filter on MULTIPLE fields together.
// e.g. "Find all resumes WHERE userId=X ORDER BY createdAt DESC"
// Without this index, Mongo scans every document. With it — instant lookup.
ResumeSchema.index({ userId: 1, createdAt: -1 });
// 1 = ascending sort, -1 = descending sort

export default mongoose.model('Resume', ResumeSchema);
