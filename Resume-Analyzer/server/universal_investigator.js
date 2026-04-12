import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Get ALL Users
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        
        // 2. Get ALL Jobs
        const jobs = await mongoose.connection.db.collection('jobs').find({}).toArray();
        
        // 3. Get ALL Applications
        const apps = await mongoose.connection.db.collection('applications').find({}).toArray();

        const dump = { 
            userEmails: users.map(u => u.email),
            jobOwners: jobs.map(j => j.postedBy),
            appSeekers: apps.map(a => a.seekerId)
        };

        fs.writeFileSync('universal_dump.json', JSON.stringify(dump, null, 2));

        // Let's specifically look for 'resumematch.ai' as a substring in the STRINGIFIED database
        const collections = await mongoose.connection.db.listCollections().toArray();
        const foundAt = [];
        for (const col of collections) {
             const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
             const stringified = JSON.stringify(data);
             if (stringified.includes('resumematch.ai')) {
                 foundAt.push(col.name);
             }
        }
        fs.writeFileSync('found_at.json', JSON.stringify(foundAt, null, 2));

    } catch (e) {
        fs.writeFileSync('universal_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
