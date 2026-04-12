import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Enable CORS to allow the Render server to speak to this endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html, key } = req.body;

    // VERY Simple security key
    if (key !== 'resume_match_proxy_key_123') {
        return res.status(401).json({ error: 'Unauthorized call to Vercel Email Proxy' });
    }

    try {
        // Here we run Nodemailer ON VERCEL to bypass Render's strict firewall
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // STARTTLS
            auth: {
                user: process.env.VITE_GMAIL_USER || process.env.GMAIL_USER, // Vercel vars
                pass: process.env.VITE_GMAIL_PASS || process.env.GMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const info = await transporter.sendMail({
            from: `"ResumeMatch AI" <${process.env.VITE_GMAIL_USER || process.env.GMAIL_USER}>`,
            to,
            subject,
            html
        });

        res.status(200).json({ success: true, message: 'Email sent through Vercel Proxy', info });
    } catch (error) {
        console.error('Vercel Email Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
}
