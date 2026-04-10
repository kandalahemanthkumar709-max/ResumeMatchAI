import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const job = await Job.findOne({ title: /Frontend Developer/i });
    if (job) {
        console.log('Job Title:', job.title);
        console.log('Application Count:', job.applicationCount);
        console.log('View Count:', job.viewCount);
        console.log('Viewed By IDs/IPs:', job.viewedByIPs);
    } else {
        console.log('Job not found');
    }
    await mongoose.disconnect();
}

check();
