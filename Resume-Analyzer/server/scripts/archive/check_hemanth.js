import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Application from './models/Application.js';
import User from './models/User.js';

dotenv.config();

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find Kandalahemanthkumar or simply list all applications
    const users = await User.find({});
    console.log("Users:", users.map(u => ({ email: u.email, role: u.role, _id: u._id })));

    for (let u of users) {
        if (u.email.includes('hemanth') || u.email.includes('kandala')) {
            console.log("\nFound User:", u.email);
            const apps = await Application.find({ seekerId: u._id });
            console.log("Total Applications for " + u.email + ":", apps.length);
            apps.forEach((app, i) => {
                console.log(`[${i+1}] JobID: ${app.jobId}, Status: ${app.status}, AppID: ${app._id}`);
            });
        }
    }
    
    process.exit(0);
}

debug().catch(console.error);
