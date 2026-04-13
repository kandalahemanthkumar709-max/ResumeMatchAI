
import nodemailer from 'nodemailer';

/**
 * VERCEL TRANSACTIONAL EMAIL API
 * 
 * Vercel Serverless Functions allow outbound SMTP traffic, 
 * bypassing Render's networking restrictions.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { to, subject, html, replyTo, key } = req.body;

    // Security check to prevent unauthorized use of your email quota
    if (key !== process.env.VITE_PROXY_KEY && key !== 'resume_match_proxy_key_123') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = (process.env.GMAIL_USER || '').trim();
        const pass = (process.env.GMAIL_PASS || '').replace(/\s/g, '');

        if (!user || !pass) {
            console.error('MISSING CREDENTIALS IN VERCEL DASHBOARD');
            return res.status(500).json({ success: false, error: 'Email service not configured in Vercel. Please add GMAIL_USER and GMAIL_PASS to Vercel environment variables and REDEPLOY.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        await transporter.sendMail({
            from: `"ResumeMatch AI" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
            ...(replyTo && { replyTo })
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('VERCEL MAIL ERROR:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
