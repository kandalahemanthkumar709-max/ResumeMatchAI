import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';
import Application from './models/Application.js';

dotenv.config();

const syncApps = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Show what's in the Application collection
        const allApps = await Application.find({});
        console.log(`Total Application documents: ${allApps.length}`);
        allApps.forEach(a => {
            console.log(`  - seekerId: ${a.seekerId}, jobId: ${a.jobId}, appliedAt: ${a.appliedAt}`);
        });

        // Sync each job's applicationCount with real Application documents
        const jobs = await Job.find({});
        for (const job of jobs) {
            const realCount = await Application.countDocuments({ jobId: job._id });
            if (job.applicationCount !== realCount) {
                console.log(`Fixing "${job.title}": ${job.applicationCount} → ${realCount}`);
                await Job.findByIdAndUpdate(job._id, { applicationCount: realCount });
            }
        }

        console.log('\nAll application counts synced with real data!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

syncApps();
