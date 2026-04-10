import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';
import User from './models/User.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const sarah = await User.findOne({ email: 'sarah@netflix.com' });
    if (sarah) {
        const jobs = await Job.find({ postedBy: sarah._id });
        console.log(`Sarah's Jobs:`);
        jobs.forEach(j => {
            console.log(`- ${j.title} [ID: ${j._id}]`);
        });
    }
    await mongoose.disconnect();
}

check();
