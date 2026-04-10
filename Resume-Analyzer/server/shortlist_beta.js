import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Job from './models/Job.js';
import Application from './models/Application.js';

dotenv.config();

async function shortlistAndVerify() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const seeker = await User.findOne({ email: 'beta@test.com' });
    const job = await Job.findOne({ title: 'Lead Full Stack Engineer (FinTech)' });

    if (!seeker || !job) {
        console.log('Seeker or job not found!');
        await mongoose.disconnect();
        return;
    }

    const app = await Application.findOne({ jobId: job._id, seekerId: seeker._id });
    
    if (!app) {
        console.log('Application not found!');
        await mongoose.disconnect();
        return;
    }

    // Valid statuses: applied, screening, interview, offer, rejected, withdrawn
    app.status = 'screening';
    await app.save();

    console.log('');
    console.log('✅ DONE! Beta Seeker moved to SCREENING for Lead Full Stack Engineer (FinTech)!');
    console.log('');
    console.log('============================');
    console.log('  DEMO ACCOUNT CREDENTIALS  ');
    console.log('============================');
    console.log('RECRUITER: alpha@test.com / password123');  
    console.log('SEEKER:    beta@test.com  / password123');
    console.log('');
    console.log('HOW TO VERIFY:');
    console.log('1. Login as beta@test.com → Go to /tracker → Job is in "Screening" column');
    console.log('2. Login as alpha@test.com → See recruiter dashboard with 1 candidate');
    console.log('============================');

    await mongoose.disconnect();
}

shortlistAndVerify();
