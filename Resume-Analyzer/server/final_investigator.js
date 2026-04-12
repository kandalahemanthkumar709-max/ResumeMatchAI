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
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        const emails = users.map(u => ({ email: u.email, name: u.name }));
        
        fs.writeFileSync('final_user_list.json', JSON.stringify(emails, null, 2));
    } catch (e) {
        fs.writeFileSync('final_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
