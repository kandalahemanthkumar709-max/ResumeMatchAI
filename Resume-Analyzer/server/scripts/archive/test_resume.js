import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Resume from './models/Resume.js';

dotenv.config();

const checkResume = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const latestResume = await Resume.findOne().sort({ createdAt: -1 });
        
        if (!latestResume) {
            fs.writeFileSync('test_output.json', JSON.stringify({ error: 'No resumes found' }));
            process.exit(1);
        }

        const data = {
            label: latestResume.label,
            atsScore: latestResume.atsScore,
            skills: latestResume.parsedData?.skills,
            experience: latestResume.parsedData?.experience
        };
        
        fs.writeFileSync('test_output.json', JSON.stringify(data, null, 2), 'utf-8');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkResume();
