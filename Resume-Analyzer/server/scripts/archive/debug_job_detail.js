import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const id = '69d5a932f217b8df3ac151c3';
    const job = await Job.findById(id);
    if (job) {
        console.log('Job found:');
        console.log(`- Title: ${job.title}`);
        console.log(`- Status: ${job.status}`);
        console.log(`- Expires At: ${job.expiresAt}`);
        console.log(`- Current Time: ${new Date()}`);
        console.log(`- Is Expired: ${job.expiresAt < new Date()}`);
    } else {
        console.log('Job NOT found in DB');
    }
    await mongoose.disconnect();
}

check();
