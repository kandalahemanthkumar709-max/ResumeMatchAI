import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobs = await Job.find({});
    console.log('Current Database Jobs:');
    jobs.forEach(j => {
        console.log(`- ID: ${j._id} | Title: ${j.title} | Status: ${j.status}`);
    });
    await mongoose.disconnect();
}

check();
