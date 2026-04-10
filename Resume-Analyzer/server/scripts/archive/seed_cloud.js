import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Job from './models/Job.js';
import Application from './models/Application.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected!');

        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Job.deleteMany({});
        await Application.deleteMany({});

        // 1. Create Recruiter
        const recruiter = new User({
            name: 'Cloud Manager',
            email: 'cloud@resumematch.ai',
            password: 'password123',
            role: 'recruiter',
            isVerified: true
        });
        await recruiter.save();
        console.log('✅ Created Recruiter: cloud@resumematch.ai');

        // 2. Create a Job
        const job = new Job({
            title: 'Full Stack Cloud Engineer',
            company: 'Atlas Tech Systems',
            location: 'Remote',
            locationType: 'remote',
            type: 'full-time',
            salaryMin: 120000,
            salaryMax: 160000,
            description: 'We are looking for an expert Full Stack developer to manage our cloud infrastructure and build scalable web applications.',
            requirements: 'React, Node.js, MongoDB, Cloud Deployment',
            postedBy: recruiter._id,
            status: 'active'
        });
        await job.save();
        console.log('✅ Created Job: Full Stack Cloud Engineer');

        // 3. Create Seeker
        const seeker = new User({
            name: 'Cloud Seeker',
            email: 'seeker@resumematch.ai',
            password: 'password123',
            role: 'seeker',
            isVerified: true
        });
        await seeker.save();
        console.log('✅ Created Seeker: seeker@resumematch.ai');

        console.log('🎉 Cloud Database Successfully Seeded!');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
};

seedDatabase();
