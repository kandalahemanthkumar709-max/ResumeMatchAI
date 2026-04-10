import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Job from './models/Job.js';

dotenv.config();

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Create Recruiter
    let alpha = await User.findOne({ email: 'alpha@test.com' });
    if (!alpha) {
        alpha = await User.create({
            name: 'Alpha Recruiter',
            email: 'alpha@test.com',
            password: 'password123',
            role: 'recruiter'
        });
        console.log('Alpha Recruiter created');
    }

    // 2. Create Seeker
    let beta = await User.findOne({ email: 'beta@test.com' });
    if (!beta) {
        beta = await User.create({
            name: 'Beta Seeker',
            email: 'beta@test.com',
            password: 'password123',
            role: 'seeker'
        });
        console.log('Beta Seeker created');
    }

    // 3. Create a Job for Alpha
    const newJob = await Job.create({
        title: 'Lead Full Stack Engineer (FinTech)',
        company: 'Alpha Innovations',
        description: 'We are looking for a world-class React and Node.js expert. Must have 7+ years of experience with distributed systems and premium UI design.',
        location: 'Remote',
        locationType: 'remote',
        salary: { min: 140000, max: 180000, isVisible: true },
        postedBy: alpha._id,
        structuredData: {
            required_skills: ['React', 'Node.js', 'PostgreSQL', 'Cloud Architecture'],
            seniority_level: 'Lead'
        }
    });
    console.log(`New Job Created ID: ${newJob._id}`);
    
    await mongoose.disconnect();
}

seed();
