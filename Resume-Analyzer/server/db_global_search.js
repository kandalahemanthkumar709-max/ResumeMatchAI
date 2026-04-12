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
        const results = {};

        for (const colInfo of collections) {
            const name = colInfo.name;
            const count = await mongoose.connection.db.collection(name).countDocuments({
                $or: [
                    { email: /resumematch\.ai/i },
                    { seekerEmail: /resumematch\.ai/i },
                    { 'postedBy.email': /resumematch\.ai/i }
                ]
            });
            
            if (count > 0) {
                 const docs = await mongoose.connection.db.collection(name).find({
                     $or: [
                        { email: /resumematch\.ai/i },
                        { seekerEmail: /resumematch\.ai/i },
                        { 'postedBy.email': /resumematch\.ai/i }
                    ]
                 }).limit(5).toArray();
                 results[name] = docs;
            }
        }

        // Generic search as string in any field (brute force for small collections)
        const allDocs = {};
        for (const colInfo of collections) {
            const name = colInfo.name;
            const sample = await mongoose.connection.db.collection(name).find({}).toArray();
            const problematic = sample.filter(doc => JSON.stringify(doc).includes('resumematch.ai'));
            if (problematic.length > 0) {
                allDocs[name] = problematic.map(d => ({ _id: d._id, email: d.email || 'N/A' }));
            }
        }

        fs.writeFileSync('db_global_search.json', JSON.stringify({ results, allDocs }, null, 2));
    } catch (e) {
        fs.writeFileSync('db_error.txt', e.stack);
    } finally {
        process.exit(0);
    }
}
run();
