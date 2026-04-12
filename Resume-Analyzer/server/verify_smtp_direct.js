import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function directTest() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    const testEmail = 'kandalahemanthkumar709@gmail.com';

    if (!user || !pass) {
        console.error('❌ Missing credentials in .env!');
        process.exit(1);
    }

    console.log(`📡 Attempting direct SMTP connection for ${user}...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });

    try {
        console.log('📤 Sending direct test email...');
        const info = await transporter.sendMail({
            from: `"ResumeMatch AI Test" <${user}>`,
            to: testEmail,
            subject: '✅ System Verification Successful',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; background: #f4f4f4;">
                    <h2>System Audit Result: SUCCESS</h2>
                    <p>This email confirms that your <strong>Nodemailer</strong> credentials and <strong>App Password</strong> are correctly configured.</p>
                    <p>Your application is now capable of sending premium notifications to candidates and recruiters.</p>
                    <hr/>
                    <p style="font-size: 12px; color: #999;">Audit Timestamp: ${new Date().toLocaleString()}</p>
                </div>
            `
        });

        console.log('✨ SUCCESS! Message ID:', info.messageId);
        console.log('👉 Please check your inbox now.');
    } catch (e) {
        console.error('❌ SMTP Error:', e.message);
        if (e.message.includes('Invalid login')) {
            console.log('TIP: Ensure you are using a Google "App Password" (16 characters) and NOT your regular password.');
        }
    } finally {
        process.exit(0);
    }
}

directTest();
