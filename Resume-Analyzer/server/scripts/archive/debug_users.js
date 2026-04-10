import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('Registered Users:');
    users.forEach(u => {
        console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`);
    });
    await mongoose.disconnect();
}

check();
