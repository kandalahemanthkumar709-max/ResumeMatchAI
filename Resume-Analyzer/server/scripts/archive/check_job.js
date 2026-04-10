import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Job from './models/Job.js';

dotenv.config();

const checkJob = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const job = await Job.findOne({ title: /Full/i }).sort({ createdAt: -1 });

        if (!job) {
            fs.writeFileSync('job_debug.json', JSON.stringify({ error: 'Missing job' }));
            process.exit(1);
        }

        fs.writeFileSync('job_debug.json', JSON.stringify({
            title: job.title,
            structuredData: job.structuredData
        }, null, 2));

        process.exit(0);
    } catch (err) {
        fs.writeFileSync('job_debug.json', JSON.stringify({ error: err.stack }));
        process.exit(1);
    }
};

checkJob();
