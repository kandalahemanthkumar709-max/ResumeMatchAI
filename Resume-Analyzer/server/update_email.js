import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const swapEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        // 1. Rename existing user out of the way
        const existing = await User.findOneAndUpdate(
            { email: 'kandalahemanthkumar709@gmail.com' },
            { $set: { email: 'kandala.backup709@gmail.com' } }
        );
        if (existing) console.log('Moved existing account safely out of the way.');

        // 2. Change the recruiter to the desired email
        const result = await User.findOneAndUpdate(
            { email: 'hemanth.recruiter@example.com' },
            { $set: { email: 'kandalahemanthkumar709@gmail.com' } },
            { returnDocument: 'after' }
        );

        console.log('✅ Successfully linked Recruiter Account to:', result.email);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

swapEmail();
