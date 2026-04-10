import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job.js';

dotenv.config();

const resetCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Wipe view counts clean and empty the tracking arrays
        await Job.updateMany({}, { 
            $set: { 
                viewCount: 0,
                viewedByIPs: []
            } 
        });

        console.log('Successfully wiped all view histories globally!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetCounts();
