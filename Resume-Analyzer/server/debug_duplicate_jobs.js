import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobs = await Job.find({ title: /Frontend Developer/i });
    console.log('Total Jobs matching "Frontend Developer":', jobs.length);
    jobs.forEach(j => {
        console.log(`ID: ${j._id}, Company: ${j.company}, Apps: ${j.applicationCount}`);
    });
    await mongoose.disconnect();
}

check();
