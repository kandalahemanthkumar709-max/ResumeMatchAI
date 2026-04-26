/**
 * Seed Recruiter Script
 * - Creates a recruiter user account
 * - Re-links all existing jobs in the DB to that recruiter
 * Run: node server/scripts/seedRecruiter.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Job from '../models/Job.js';

const RECRUITER = {
    name: 'resusesh',
    email: 'gonirusesh@gmail.com',
    password: '123456',
    role: 'recruiter',
    isVerified: true,
};

async function seed() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // 1. Check if recruiter already exists
        let recruiter = await User.findOne({ email: RECRUITER.email });

        if (recruiter) {
            console.log(`⚠️  Recruiter already exists: ${recruiter.email} (ID: ${recruiter._id})`);
        } else {
            // 2. Hash password and create recruiter
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(RECRUITER.password, salt);

            recruiter = await User.create({
                name: RECRUITER.name,
                email: RECRUITER.email,
                password: hashedPassword,
                role: RECRUITER.role,
                isVerified: RECRUITER.isVerified,
            });

            console.log(`✅ Recruiter created!`);
            console.log(`   Name  : ${recruiter.name}`);
            console.log(`   Email : ${recruiter.email}`);
            console.log(`   ID    : ${recruiter._id}\n`);
        }

        // 3. Re-link all jobs to the new recruiter
        const result = await Job.updateMany({}, { postedBy: recruiter._id });
        console.log(`✅ Updated ${result.modifiedCount} job(s) → linked to recruiter "${recruiter.name}"\n`);

        console.log('🎉 Done! You can now log in as:');
        console.log(`   Email   : ${RECRUITER.email}`);
        console.log(`   Password: ${RECRUITER.password}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB.');
        process.exit(0);
    }
}

seed();
