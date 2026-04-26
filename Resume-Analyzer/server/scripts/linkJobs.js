/**
 * Link Jobs to Recruiter Script
 * - Finds the recruiter by email
 * - Links ALL jobs in Atlas to that recruiter
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';

const RECRUITER_EMAIL = 'gonirusesh@gmail.com';

async function linkJobs() {
    try {
        console.log('🔌 Connecting to Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName, '\n');

        const db = mongoose.connection.db;

        // 1. Find the recruiter in users collection
        const recruiter = await db.collection('users').findOne({ email: RECRUITER_EMAIL });

        if (!recruiter) {
            // Create the recruiter directly in Atlas
            console.log('⚠️  Recruiter not found in Atlas. Creating now...');
            const bcrypt = (await import('bcryptjs')).default;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            const result = await db.collection('users').insertOne({
                name: 'resusesh',
                email: RECRUITER_EMAIL,
                password: hashedPassword,
                role: 'recruiter',
                isVerified: true,
                avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const newId = result.insertedId;
            console.log(`✅ Recruiter created in Atlas! ID: ${newId}`);

            // Link all jobs to this new recruiter
            const update = await db.collection('jobs').updateMany({}, { $set: { postedBy: newId } });
            console.log(`✅ Linked ${update.modifiedCount} jobs to recruiter!\n`);
        } else {
            console.log(`✅ Recruiter found: ${recruiter.name} (ID: ${recruiter._id})`);

            // Count jobs before update
            const jobCount = await db.collection('jobs').countDocuments();
            console.log(`📦 Total jobs in Atlas: ${jobCount}`);

            // Link all jobs to this recruiter
            const update = await db.collection('jobs').updateMany({}, { $set: { postedBy: recruiter._id } });
            console.log(`✅ Linked ${update.modifiedCount} jobs to recruiter "${recruiter.name}"!\n`);
        }

        // Show sample jobs to confirm
        const jobs = await db.collection('jobs').find({}).limit(3).toArray();
        console.log('🔍 Sample jobs:');
        jobs.forEach(j => console.log(`   - "${j.title}" at "${j.company}" | postedBy: ${j.postedBy}`));

        console.log('\n🎉 Done! Log in as:');
        console.log('   Email   : gonirusesh@gmail.com');
        console.log('   Password: 123456');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected.');
        process.exit(0);
    }
}

linkJobs();
