import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';

async function check() {
    try {
        console.log('🔌 Connecting to:', process.env.MONGO_URI?.slice(0, 40) + '...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📦 Collections in DB:');
        collections.forEach(c => console.log(`   - ${c.name}`));

        // Count documents in each collection
        console.log('\n📊 Document counts:');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`   ${col.name}: ${count} documents`);
        }

        // Show first job if exists
        const jobs = await mongoose.connection.db.collection('jobs').find({}).limit(3).toArray();
        if (jobs.length > 0) {
            console.log('\n🔍 Sample jobs found:');
            jobs.forEach(j => console.log(`   - "${j.title}" by company "${j.company}" | postedBy: ${j.postedBy}`));
        } else {
            console.log('\n❌ No jobs found in "jobs" collection');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

check();
