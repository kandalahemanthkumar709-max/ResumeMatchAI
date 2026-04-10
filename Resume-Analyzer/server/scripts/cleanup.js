import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import MatchCache from '../models/MatchCache.js';
import colors from 'colors';

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🧹 Connected to MongoDB for cleanup...'.cyan);

        console.log('🗑️ Deleting all Applications...'.yellow);
        await Application.deleteMany({});

        console.log('🗑️ Deleting all Resumes...'.yellow);
        await Resume.deleteMany({});

        console.log('🗑️ Deleting all Match Caches...'.yellow);
        await MatchCache.deleteMany({});

        console.log('🗑️ Deleting all Jobs...'.yellow);
        await Job.deleteMany({});

        console.log('🗑️ Deleting all Users...'.yellow);
        await User.deleteMany({});

        console.log('\n✨ DATABASE WIPED CLEAN!'.green.bold);
        process.exit(0);
    } catch (err) {
        console.error('❌ CLEANUP FAILED:'.red, err.message);
        process.exit(1);
    }
};

cleanup();
