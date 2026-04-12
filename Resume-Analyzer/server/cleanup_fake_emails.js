import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const FAKE_DOMAINS = [
    'example.com',
    'resumematch.ai',
    'test.com',
    'demo.com',
    'fake.com',
    'placeholder.com'
];

const cleanupFakeEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCol = db.collection('users');

        // Build regex pattern to match any fake domain
        const fakeEmailRegex = new RegExp(
            FAKE_DOMAINS.map(d => `@${d.replace('.', '\\.')}`).join('|'),
            'i'
        );

        // 1. Find all fake-email users
        const fakeUsers = await usersCol.find({ email: fakeEmailRegex }).toArray();
        
        console.log(`🔍 Found ${fakeUsers.length} accounts with fake email domains:`);
        fakeUsers.forEach(u => console.log(`   - [${u.role || 'unknown'}] ${u.name} <${u.email}>`));

        if (fakeUsers.length === 0) {
            console.log('\n✅ Database is already clean!');
            return;
        }

        // 2. Delete fake users
        const fakeIds = fakeUsers.map(u => u._id);
        const deleteResult = await usersCol.deleteMany({ _id: { $in: fakeIds } });
        
        // 3. Clean up their applications, jobs, and notifications
        const appsCol = db.collection('applications');
        const jobsCol = db.collection('jobs');
        const notifsCol = db.collection('notifications');

        const appsDel = await appsCol.deleteMany({ seekerId: { $in: fakeIds } });
        const jobsDel = await jobsCol.deleteMany({ postedBy: { $in: fakeIds } });
        const notifsDel = await notifsCol.deleteMany({ userId: { $in: fakeIds } });

        console.log(`\n🗑️  Cleanup Summary:`);
        console.log(`   Users deleted:         ${deleteResult.deletedCount}`);
        console.log(`   Applications removed:  ${appsDel.deletedCount}`);
        console.log(`   Jobs removed:          ${jobsDel.deletedCount}`);
        console.log(`   Notifications removed: ${notifsDel.deletedCount}`);
        console.log('\n✅ Done! Database is now clean.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

cleanupFakeEmails();
