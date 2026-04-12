import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { queueEmail, sendRecruiterEmail } from './services/email.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
    const testEmail = 'kandalahemanthkumar709@gmail.com';
    console.log(`🚀 Starting real-world test for: ${testEmail}`);

    try {
        // 1. Test Seeker Status Update (Premium Template)
        console.log('Sending Seeker "Interview" update...');
        await queueEmail({
            to: testEmail,
            name: 'Hemanth',
            jobTitle: 'Senior AI Engineer',
            status: 'interview',
            note: 'We loved your resume matching score of 95%! Let\'s talk.'
        });

        // 2. Test Recruiter Notification
        console.log('Sending Recruiter "New Application" alert...');
        await sendRecruiterEmail({
            to: testEmail, // Sending to same address for verification
            recruiterName: 'Hiring Lead',
            seekerName: 'Hemanth',
            jobTitle: 'Senior AI Engineer',
            event: 'new_application',
            coverLetter: 'I am highly passionate about Generative AI and building agentic systems.'
        });

        console.log('✅ Both test emails have been queued. Please check your inbox (and spam just in case)!');
    } catch (e) {
        console.error('❌ Test failed:', e.message);
    } finally {
        process.exit(0);
    }
}

test();
