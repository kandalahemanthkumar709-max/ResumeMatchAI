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
        const apps = await mongoose.connection.db.collection('applications').find({}).toArray();
        fs.writeFileSync('db_apps_full_v2.json', JSON.stringify(apps, null, 2));
    } catch (e) {
        fs.writeFileSync('db_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
