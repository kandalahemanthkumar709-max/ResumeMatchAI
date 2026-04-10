import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Job from './models/Job.js';
import Resume from './models/Resume.js';
import Application from './models/Application.js';

dotenv.config();

async function completeFlow() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const seeker = await User.findOne({ email: 'beta@test.com' });
    const job = await Job.findOne({ title: 'Lead Full Stack Engineer (FinTech)' });

    if (seeker && job) {
        // 1. Create a dummy resume for Beta
        const resume = await Resume.create({
            userId: seeker._id,
            label: 'Master_Resume_2026',
            fileUrl: 'https://res.cloudinary.com/dummy/image/upload/v1/resumes/beta.pdf',
            rawText: 'Experienced Full Stack Developer with expert skills in React, Node.js, and Cloud Infrastructure.',
            status: 'parsed',
            isDefault: true
        });
        console.log('Resume created for Beta Seeker');

        // 2. Submit Application
        await Application.create({
            jobId: job._id,
            seekerId: seeker._id,
            resumeId: resume._id,
            coverLetter: 'I am the perfect fit for this Alpha Innovations role!'
        });

        // 3. Update Job Count
        job.applicationCount += 1;
        await job.save();
        
        console.log('Application submitted from Beta to Alpha!');
    }
    
    await mongoose.disconnect();
}

completeFlow();
