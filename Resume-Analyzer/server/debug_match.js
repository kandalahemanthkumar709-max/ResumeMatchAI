import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Resume from './models/Resume.js';
import Job from './models/Job.js';
import { calculateSkillScore } from './services/matching.service.js';

dotenv.config();

const testMatch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const resume = await Resume.findOne({ originalName: /ANANDH/i }).sort({ createdAt: -1 });
        const job = await Job.findOne({ title: /Full/i }).sort({ createdAt: -1 });

        if (!resume || !job) {
            fs.writeFileSync('debug_out.json', JSON.stringify({ error: `Could not find resume or job` }), 'utf-8');
            process.exit(1);
        }

        const rSkills = [
            ...(resume.parsedData?.skills?.hard || []),
            ...(resume.parsedData?.skills?.soft || []),
            ...(resume.parsedData?.skills?.tools || [])
        ];

        const result = calculateSkillScore(rSkills, job.structuredData?.required_skills, []);
        
        fs.writeFileSync('debug_out.json', JSON.stringify({
           rSkills,
           jobReq: job.structuredData?.required_skills,
           result
        }, null, 2), 'utf-8');

        process.exit(0);
    } catch (err) {
        fs.writeFileSync('debug_out.json', JSON.stringify({ error: err.message }), 'utf-8');
        process.exit(1);
    }
};

testMatch();
