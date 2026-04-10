import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';
import Application from './models/Application.js';

dotenv.config();

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const job = await Job.findOne({ title: /Frontend Developer/i });
    if (job) {
        console.log('Original Stats:', { app: job.applicationCount, view: job.viewCount });
        
        // Find all applications for this job to get unique users
        const apps = await Application.find({ jobId: job._id });
        const userIds = apps.map(a => a.seekerId.toString());
        
        console.log('Users who applied:', userIds);
        
        // Add existing IDs to viewedByIPs
        userIds.forEach(id => {
            if (!job.viewedByIPs.includes(id)) {
                job.viewedByIPs.push(id);
            }
        });
        
        // Ensure viewCount is at least the length of unique viewers
        job.viewCount = Math.max(job.viewCount, job.viewedByIPs.length);
        
        await job.save();
        console.log('Fixed Stats:', { app: job.applicationCount, view: job.viewCount, viewers: job.viewedByIPs });
    } else {
        console.log('Job not found');
    }
    await mongoose.disconnect();
}

fix();
