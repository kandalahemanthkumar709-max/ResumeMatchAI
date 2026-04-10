import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Resume from './models/Resume.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const resume = await Resume.findOne({ label: /FRENTEND_Resume/i });
    if (resume) {
        console.log('Resume Label:', resume.label);
        console.log('Skills:', resume.parsedData?.skills);
    } else {
        console.log('Resume not found');
    }
    await mongoose.disconnect();
}

check();
