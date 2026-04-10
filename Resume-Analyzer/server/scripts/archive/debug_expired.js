import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobs = await Job.find({});
    console.log('Total Jobs:', jobs.length);
    jobs.forEach(j => {
        console.log(`Title: ${j.title}, Status: ${j.status}, ExpiresAt: ${j.expiresAt}, Now: ${new Date()}`);
        console.log(`Is Expired? ${new Date(j.expiresAt) < new Date()}`);
    });
    await mongoose.disconnect();
}

check();
