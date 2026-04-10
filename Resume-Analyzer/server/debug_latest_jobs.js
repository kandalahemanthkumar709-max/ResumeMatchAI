import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });
    console.log('Total Active Jobs:', jobs.length);
    jobs.forEach((j, i) => {
        console.log(`${i+1}. ${j.title} @ ${j.company} [ID: ${j._id}]`);
    });
    await mongoose.disconnect();
}

check();
