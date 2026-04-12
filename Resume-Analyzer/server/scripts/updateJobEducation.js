import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';
import { structureJobDescription } from '../services/ai.service.js';
import colors from 'colors';

dotenv.config();

/**
 * MIGRATION SCRIPT: Update all existing jobs with specific education requirements.
 * 
 * Why? The user wants to ensure every job has a valid education level for better ATS matching.
 * This script re-runs the AI structuring logic specifically for education if it's currently vague.
 */
const updateJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB...'.cyan);

        const jobs = await Job.find({});
        console.log(`🔍 Found ${jobs.length} jobs to evaluate.`.yellow);

        let updatedCount = 0;

        for (const job of jobs) {
            const currentEdu = job.structuredData?.education_required || '';
            const isVague = !currentEdu || 
                            currentEdu.toLowerCase().includes('not specified') || 
                            currentEdu.toLowerCase().includes('vague');

            if (isVague) {
                console.log(`⚙️  Updating Education for: "${job.title}"...`.white);
                
                try {
                    // Re-run the structuring logic to infer education
                    const newData = await structureJobDescription(
                        job.description, 
                        job.title, 
                        job.requirements
                    );

                    if (newData && newData.education_required) {
                        job.structuredData.education_required = newData.education_required;
                        await job.save();
                        updatedCount++;
                        console.log(`   ✅ Set to: ${newData.education_required}`.green);
                    }
                } catch (aiErr) {
                    console.error(`   ❌ AI failed for ${job.title}:`, aiErr.message.red);
                }

                // Add a small delay to avoid hitting rate limits too fast
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log(`   ⏭️ Skipping "${job.title}" (already has: ${currentEdu})`.gray);
            }
        }

        console.log(`\n✨ FINISHED! Updated ${updatedCount} jobs.`.green.bold);
        process.exit(0);
    } catch (err) {
        console.error('❌ MIGRATION FAILED:'.red, err.message);
        process.exit(1);
    }
};

updateJobs();
