import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';
import Resume from './models/Resume.js';
import { getOrCreateMatch } from './services/matching.service.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobId = '69d58938e53dd6330ad30535';
    const allResumes = await Resume.find({ status: 'parsed' }).limit(100);
    console.log(`Found ${allResumes.length} resumes`);

    const matchPromises = allResumes.map(async (resume) => {
        try {
            const m = await getOrCreateMatch(resume.userId, resume._id, jobId);
            return m;
        } catch (err) {
            console.log(`Error matching resume ${resume._id}: ${err.message}`);
            return null;
        }
    });

    const allResults = await Promise.all(matchPromises);
    const filtered = allResults.filter(m => m !== null);
    console.log(`Successful matches: ${filtered.length}`);
    
    filtered.forEach(m => {
        console.log(`ID: ${m._id}, Score: ${m.overallScore}`);
    });

    await mongoose.disconnect();
}

check();
