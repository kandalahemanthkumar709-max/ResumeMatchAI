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
            service: 'gmail',
            auth: {
                user: 'kandalahemanthkumar709@gmail.com',
                pass: 'rtllfjbiseqiqkgl'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.sendMail({
            from: '"ResumeMatch AI" <kandalahemanthkumar709@gmail.com>',
            to,
            subject,
            html,
            ...(replyTo && { replyTo })
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Proxy Email Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
