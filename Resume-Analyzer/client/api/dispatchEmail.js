
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
        console.log('🔍 [Vercel API] Checking Environment Keys...');
        const keys = Object.keys(process.env);
        console.log(`🔍 [Vercel API] Available keys: ${keys.filter(k => k.includes('GMAIL') || k.includes('URL')).join(', ')}`);

        // Automatic fallback for GMAIL_USER if Vercel dashboard has a typo
        const user = (process.env.GMAIL_USER || 'kandalahemanthkumar709@gmail.com').trim();
        const pass = (process.env.GMAIL_PASS || '').replace(/\s/g, '');

        if (!pass) {
            return res.status(500).json({ success: false, error: 'Email service configuration incomplete.' });
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
