import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

const removeDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Get all jobs
        const allJobs = await Job.find({}).sort({ createdAt: 1 });
        console.log(`Total jobs in DB: ${allJobs.length}`);

        // Group by title (case-insensitive)
        const seen = new Map();
        const dupeIds = [];

        for (const job of allJobs) {
            const key = job.title.toLowerCase().trim();
            if (seen.has(key)) {
                // This is a duplicate — mark for deletion
                dupeIds.push(job._id);
                console.log(`  DUPLICATE: "${job.title}" (id: ${job._id}, created: ${job.createdAt})`);
            } else {
                seen.set(key, job._id);
                console.log(`  KEEP: "${job.title}" (id: ${job._id})`);
            }
        }

        console.log(`\nFound ${dupeIds.length} duplicates to remove.`);

        if (dupeIds.length > 0) {
            const result = await Job.deleteMany({ _id: { $in: dupeIds } });
            console.log(`Deleted ${result.deletedCount} duplicate jobs.`);
        }

        // Show final state
        const remaining = await Job.find({}).select('title status');
        console.log(`\nRemaining jobs (${remaining.length}):`);
        remaining.forEach(j => console.log(`  - ${j.title} [${j.status}]`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

removeDuplicates();
