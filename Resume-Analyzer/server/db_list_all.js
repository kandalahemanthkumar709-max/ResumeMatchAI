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
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        fs.writeFileSync('db_list.json', JSON.stringify(dbs, null, 2));
    } catch (e) {
        fs.writeFileSync('db_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
