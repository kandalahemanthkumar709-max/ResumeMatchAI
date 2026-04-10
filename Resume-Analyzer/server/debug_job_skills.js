import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const job = await Job.findOne({ title: /Frontend Developer/i });
    if (job) {
        console.log('Job Title:', job.title);
        console.log('Required Skills:', job.structuredData?.required_skills);
    } else {
        console.log('Job not found');
    }
    await mongoose.disconnect();
}

check();
