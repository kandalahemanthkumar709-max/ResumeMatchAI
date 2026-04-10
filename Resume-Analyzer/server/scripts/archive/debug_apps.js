import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';
import Application from './models/Application.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const jobs = await Job.find({}).select('title _id');
    for (const job of jobs) {
        const apps = await Application.find({ jobId: job._id })
            .populate('seekerId', 'name email')
            .populate('resumeId', 'label');
        if (apps.length > 0) {
            console.log(`\nJob: ${job.title}`);
            apps.forEach(a => {
                console.log(`  - Seeker: ${a.seekerId?.name} (${a.seekerId?._id}) | Resume: ${a.resumeId?.label} | Status: ${a.status}`);
            });
        }
    }
    
    await mongoose.disconnect();
}

check();
