import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find all users with the problematic domain
        const users = await User.find({ email: /@resumematch.ai/i });
        console.log(`🔍 Found ${users.length} users with @resumematch.ai emails.`);

        for (const user of users) {
             const oldEmail = user.email;
             const newEmail = oldEmail.replace(/@resumematch.ai/i, '@internal.test');
             user.email = newEmail;
             await user.save();
             console.log(`✅ Updated: ${oldEmail} -> ${newEmail}`);
        }

        console.log('✨ All bounce-back emails silenced!');
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
