import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Resume from './models/Resume.js';
import Job from './models/Job.js';
import { getOrCreateMatch, calculateSkillScore } from './services/matching.service.js';
import MatchCache from './models/MatchCache.js';

dotenv.config();

const debugFullMatch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const resume = await Resume.findOne().sort({ createdAt: -1 });
        const job = await Job.findOne({ title: /Full/i }).sort({ createdAt: -1 });

        if (!resume || !job) {
            fs.writeFileSync('debug_full.json', JSON.stringify({ error: 'Missing resume or job' }));
            process.exit(1);
        }

        // Force delete cache to see live calculation
        await MatchCache.deleteMany({ resumeId: resume._id, jobId: job._id });

        const rSkills = [
            ...(resume.parsedData?.skills?.hard || []),
            ...(resume.parsedData?.skills?.soft || []),
            ...(resume.parsedData?.skills?.tools || [])
        ];

        const skillResult = calculateSkillScore(rSkills, job.structuredData?.required_skills, []);

        const match = await getOrCreateMatch(resume.userId, resume._id, job._id);

        fs.writeFileSync('debug_full.json', JSON.stringify({
            resumeSkills: rSkills,
            jobRequired: job.structuredData?.required_skills,
            skillScoreRaw: skillResult,
            finalScore: match.overallScore,
            breakdown: match.breakdown
        }, null, 2));

        process.exit(0);
    } catch (err) {
        fs.writeFileSync('debug_full.json', JSON.stringify({ error: err.stack }));
        process.exit(1);
    }
};

debugFullMatch();
