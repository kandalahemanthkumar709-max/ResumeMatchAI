import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Job from './models/Job.js';
import Resume from './models/Resume.js';
import Application from './models/Application.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const sarah = await User.findOne({email: 'sarah@netflix.com'});
        const seeker = await User.findOne({email: 'demo@resumematch.ai'});
        
        if (!sarah || !seeker) {
            console.log('Users not found');
            process.exit(1);
        }

        const job = await Job.findOne({postedBy: sarah._id, title: /Agentic AI/i});
        if (!job) {
            console.log('Job not found');
            process.exit(1);
        }

        const resume = await Resume.findOne({userId: seeker._id, isDefault: true}) || await Resume.findOne({userId: seeker._id});
        if (!resume) {
            console.log('Resume not found');
            process.exit(1);
        }

        const existingApp = await Application.findOne({seekerId: seeker._id, jobId: job._id});
        if (existingApp) {
            console.log('Application already exists!');
            process.exit(0);
        }

        await Application.create({
            seekerId: seeker._id,
            jobId: job._id,
            resumeId: resume._id,
            status: 'applied'
        });

        job.applicationCount += 1;
        await job.save();

        console.log("✅ Successfully applied Alex Demo to Sarah's Agentic AI Job!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
