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
        const user = await mongoose.connection.db.collection('users').findOne({ 
             _id: new mongoose.Types.ObjectId('69d9c6435aed39175420235a') 
        });
        
        fs.writeFileSync('target_user.json', JSON.stringify(user, null, 2));
    } catch (e) {
        fs.writeFileSync('target_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
