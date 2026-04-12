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
        const collections = await mongoose.connection.db.listCollections().toArray();
        const names = collections.map(c => c.name);
        
        let output = { collections: names, users: [] };
        
        if (names.includes('users')) {
            const users = await mongoose.connection.db.collection('users').find({}).toArray();
            output.users = users.map(u => ({ email: u.email, name: u.name }));
        }
        
        fs.writeFileSync('db_debug.json', JSON.stringify(output, null, 2));
        console.log('✅ Debug info written to db_debug.json');
    } catch (e) {
        fs.writeFileSync('db_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
