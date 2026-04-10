import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function clean() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        // Use standard collection name 'jobs' (pluralized by mongoose)
        const collection = mongoose.connection.db.collection('jobs');
        
        // Drop only the text index if we want to be safe, or all
        // Let's drop all except _id
        await collection.dropIndexes();
        console.log('Indexes dropped. Mongoose will recreate them on next start.');
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

clean();
