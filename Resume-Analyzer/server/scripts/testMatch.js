import mongoose from 'mongoose';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import { getOrCreateMatch } from '../services/matching.service.js';
import dotenv from 'dotenv';
import colors from 'colors';

dotenv.config();

const testMatch = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const user = await User.findOne({ email: 'john@myskills.com' });
        const job  = await Job.findOne({ title: 'Senior React Developer' });
        const resume = await Resume.findOne({ userId: user._id });

        console.log(`Matching User(${user._id}) with Job(${job._id}) using Resume(${resume._id})`);

        const result = await getOrCreateMatch(user._id, resume._id, job._id);
        console.log('✅ Match calculated! Score:', result.overallScore);
        process.exit(0);
    } catch (err) {
        console.error('❌ MATCH FAILED:'.red, err);
        process.exit(1);
    }
};

testMatch();
