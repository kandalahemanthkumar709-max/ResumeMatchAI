import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function reset() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const accounts = ['sarah@netflix.com', 'john@myskills.com'];
    
    for (const email of accounts) {
        const user = await User.findOne({ email });
        if (user) {
            user.password = 'password123';
            await user.save();
            console.log(`Password reset for ${email}`);
        } else {
            console.log(`User ${email} not found`);
        }
    }
    
    await mongoose.disconnect();
}

reset();
