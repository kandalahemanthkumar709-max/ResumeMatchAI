import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { to, subject, html, replyTo, key } = req.body;

    // Security check
    if (key !== 'resume_match_proxy_key_123') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.PROXY_GMAIL_USER || 'kandalahemanthkumar709@gmail.com',
                pass: process.env.PROXY_GMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const info = await transporter.sendMail({
            from: '"ResumeMatch AI" <kandalahemanthkumar709@gmail.com>',
            to,
            subject,
            html,
            ...(replyTo && { replyTo })
        });

        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('SERVERLESS PROXY ERROR:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack // Added for debugging
        });
    }
}
