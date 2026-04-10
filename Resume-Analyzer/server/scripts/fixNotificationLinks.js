import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume-analyzer';

mongoose.connect(MONGO_URI).then(async () => {
    console.log('✅ Connected to MongoDB');

    const result = await mongoose.connection.collection('notifications').updateMany(
        { link: /^\/applications\// },
        { $set: { link: '/tracker' } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} broken notification links → /tracker`);
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
