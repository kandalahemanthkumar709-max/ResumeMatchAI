import Resume from '../models/Resume.js';
import { parseResume } from '../services/parser.service.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import analyzeResume from '../utils/groqAI.js';

/**
 * RESUME CONTROLLER — All business logic for resume operations
 *
 * Flow for upload:
 * 1. multer puts the file in memory → req.file.buffer
 * 2. We parse text from the buffer (pdf-parse / mammoth)
 * 3. We upload the file to Cloudinary → get back a URL
 * 4. We send the raw text to Groq AI → get back structured JSON
 * 5. We save everything (URL, raw text, AI data) to MongoDB
 * 6. Return the saved resume to the frontend
 */

// ─── POST /api/resumes/upload ─────────────────────────────────────────────────
export const uploadResume = async (req, res, next) => {
    try {
        // multer puts file info in req.file. If it's missing, user sent no file.
        if (!req.file) {
            res.status(400);
            throw new Error('No file uploaded. Please select a PDF or DOCX file.');
        }

        const { buffer, mimetype, originalname, size } = req.file;
        const label = req.body.label || originalname; // user can give a custom label

        console.log(`📄 Processing: ${originalname} (${(size / 1024).toFixed(1)} KB)`);

        // STEP 1: Extract raw text from the file buffer
        console.log('⚙️  Parsing document...');
        const rawText = await parseResume(buffer, mimetype);
        console.log(`✅ Extracted ${rawText.length} characters of text`);

        // STEP 2: Upload to Cloudinary (only if keys are configured)
        let fileUrl = '';
        let cloudinaryPublicId = null;

        const cloudinaryConfigured =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here';

        if (cloudinaryConfigured) {
            console.log('☁️  Uploading to Cloudinary...');
            const result = await uploadToCloudinary(buffer, originalname, mimetype);
            fileUrl = result.url;
            cloudinaryPublicId = result.publicId;
            console.log('✅ Cloudinary upload complete');
        } else {
            console.log('⚠️  Cloudinary not configured — skipping cloud upload.');
            fileUrl = `local://${originalname}`; // placeholder until Cloudinary is set up
        }

        // STEP 3: Send raw text to Groq AI for parsing and scoring
        console.log('🤖 Sending to Groq AI for analysis...');
        let parsedData = null;
        let atsScore = null;
        let atsIssues = [];
        let status = 'pending';

        try {
            // analyzeResume now returns structured JSON including score, strengths etc.
            const aiResult = await analyzeResume(buffer, rawText); // pass rawText too
            parsedData = aiResult;
            atsScore = aiResult.score || null;
            atsIssues = aiResult.weaknesses || [];
            status = 'parsed';
            console.log(`✅ AI analysis complete. ATS Score: ${atsScore}`);
        } catch (aiErr) {
            // AI failure should NOT block the upload — save with status 'failed'
            console.error('⚠️ AI parsing failed, saving without AI data:', aiErr.message);
            status = 'failed';
            atsIssues = [`AI Analysis Error: ${aiErr.message}`]; // Store the error for debugging
        }

        // STEP 4: If user has an existing default, keep it (unless no resumes exist)
        const existingCount = await Resume.countDocuments({ userId: req.user._id });
        const shouldBeDefault = existingCount === 0; // first resume auto-becomes default

        // STEP 5: Save to MongoDB
        const newResume = await Resume.create({
            userId:              req.user._id,  // from protect middleware (JWT decoded)
            label,
            fileUrl,
            cloudinaryPublicId,
            originalName:        originalname,
            mimeType:            mimetype,
            rawText,
            parsedData,
            atsScore,
            atsIssues,
            status,
            isDefault:           shouldBeDefault,
        });

        res.status(201).json({
            success: true,
            message: status === 'parsed'
                ? '✅ Resume uploaded and analyzed successfully!'
                : '⚠️ Resume uploaded but AI analysis failed. Try again later.',
            data: newResume,
        });

    } catch (error) {
        next(error); // pass to global error handler
    }
};

// ─── GET /api/resumes ─────────────────────────────────────────────────────────
export const getAllResumes = async (req, res, next) => {
    try {
        // Find all resumes for this user, newest first
        // .select('-rawText') → exclude rawText from response (it's huge, not needed in list)
        const resumes = await Resume
            .find({ userId: req.user._id })
            .select('-rawText')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: resumes.length,
            data: resumes,
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/resumes/:id ─────────────────────────────────────────────────────
export const getResumeById = async (req, res, next) => {
    try {
        // Find by ID AND userId — prevents users from accessing other users' resumes!
        const resume = await Resume.findOne({
            _id:    req.params.id,
            userId: req.user._id,
        });

        if (!resume) {
            res.status(404);
            throw new Error('Resume not found or you do not have access to it.');
        }

        res.json({ success: true, data: resume });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE /api/resumes/:id ──────────────────────────────────────────────────
export const deleteResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id:    req.params.id,
            userId: req.user._id,  // Security check — users can only delete their own resumes
        });

        if (!resume) {
            res.status(404);
            throw new Error('Resume not found.');
        }

        // Delete from Cloudinary first (don't leave orphaned files)
        if (resume.cloudinaryPublicId) {
            await deleteFromCloudinary(resume.cloudinaryPublicId);
        }

        // Delete from MongoDB
        await resume.deleteOne();

        // If deleted resume was default, set most recent remaining as default
        if (resume.isDefault) {
            const nextResume = await Resume
                .findOne({ userId: req.user._id })
                .sort({ createdAt: -1 });
            if (nextResume) {
                nextResume.isDefault = true;
                await nextResume.save();
            }
        }

        res.json({ success: true, message: 'Resume deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// ─── PATCH /api/resumes/:id/set-default ──────────────────────────────────────
export const setDefaultResume = async (req, res, next) => {
    try {
        // First, un-default ALL resumes for this user
        // $set: { isDefault: false } → updates the isDefault field on all matches
        await Resume.updateMany(
            { userId: req.user._id },
            { $set: { isDefault: false } }
        );

        // Then set the chosen one as default
        const resume = await Resume.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { isDefault: true } },
            { returnDocument: 'after' } // Updated from { new: true } to avoid deprecation warning
        );

        if (!resume) {
            res.status(404);
            throw new Error('Resume not found.');
        }

        res.json({ success: true, message: 'Default resume updated.', data: resume });
    } catch (error) {
        next(error);
    }
};
// ─── POST /api/resumes/:id/analyze ──────────────────────────────────────────
export const reanalyzeResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id:    req.params.id,
            userId: req.user._id,
        });

        if (!resume) {
            res.status(404);
            throw new Error('Resume not found.');
        }

        if (!resume.rawText) {
            res.status(400);
            throw new Error('No text content available for analysis. Please re-upload.');
        }

        console.log(`🔄 Re-analyzing: ${resume.label}...`);
        
        try {
            // We pass null as the buffer since we already have the rawText
            const aiResult = await analyzeResume(null, resume.rawText);
            
            resume.parsedData = aiResult;
            resume.atsScore = aiResult.score || 0;
            resume.atsIssues = aiResult.weaknesses || [];
            resume.status = 'parsed';
            
            await resume.save();

            res.json({
                success: true,
                message: '✅ Analysis successful!',
                data: resume,
            });
        } catch (aiErr) {
            console.error('⚠️ Re-analysis failed:', aiErr.message);
            resume.status = 'failed';
            resume.atsIssues = [`Analysis retry failed: ${aiErr.message}`];
            await resume.save();

            res.status(500).json({
                success: false,
                message: `Analysis failed: ${aiErr.message}`,
            });
        }
    } catch (error) {
        next(error);
    }
};
