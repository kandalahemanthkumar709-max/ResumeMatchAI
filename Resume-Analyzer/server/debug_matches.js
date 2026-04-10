import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MatchCache from './models/MatchCache.js';
import Job from './models/Job.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const job = await Job.findOne({ title: /Frontend Developer/i });
    if (job) {
        const matches = await MatchCache.find({ jobId: job._id });
        console.log('Matches for Job:', job.title);
        console.log('Count:', matches.length);
        matches.forEach(m => {
            console.log(`Seeker: ${m.seekerId}, Score: ${m.overallScore}`);
        });
    }
    await mongoose.disconnect();
}

check();
