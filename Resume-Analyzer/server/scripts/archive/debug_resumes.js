import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resume from './models/Resume.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const resumes = await Resume.find({});
    console.log('Total Resumes:', resumes.length);
    resumes.forEach(r => {
        console.log(`Label: ${r.label}, Status: ${r.status}, UserID: ${r.userId}`);
    });
    await mongoose.disconnect();
}

check();
