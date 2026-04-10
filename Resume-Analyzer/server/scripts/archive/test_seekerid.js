import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';
import Resume from './models/Resume.js';
import { getOrCreateMatch } from './services/matching.service.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobId = '69d58938e53dd6330ad30535';
    const allResumes = await Resume.find({ status: 'parsed' }).limit(10);
    
    for (const resume of allResumes) {
        try {
            const m = await getOrCreateMatch(resume.userId, resume._id, jobId);
            console.log(`Match for Resume ${resume._id}: Seeker=${m.seekerId}, Score=${m.overallScore}`);
        } catch (err) {
            console.log(`Error: ${err.message}`);
        }
    }

    await mongoose.disconnect();
}

check();
