import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

const resetAppCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        await Job.updateMany({}, { 
            $set: { applicationCount: 0 } 
        });

        console.log('Successfully reset all application counts to 0!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAppCounts();
