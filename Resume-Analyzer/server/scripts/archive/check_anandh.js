import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Resume from './models/Resume.js';
import Job from './models/Job.js';
import { calculateExperienceScore } from './services/matching.service.js';

dotenv.config();

const checkAnandhExp = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const resume = await Resume.findOne().sort({ createdAt: -1 });
        const job = await Job.findOne({ title: /Full/i }).sort({ createdAt: -1 });

        if (!resume || !job) {
            fs.writeFileSync('anandh_exp.json', JSON.stringify({ error: 'Missing resume or job' }));
            process.exit(1);
        }

        const exp = resume.parsedData?.experience || [];
        const score = calculateExperienceScore(exp, job.structuredData?.min_experience_years || 0);

        fs.writeFileSync('anandh_exp.json', JSON.stringify({
            experience: exp,
            score
        }, null, 2));

        process.exit(0);
    } catch (err) {
        fs.writeFileSync('anandh_exp.json', JSON.stringify({ error: err.stack }));
        process.exit(1);
    }
};

checkAnandhExp();
