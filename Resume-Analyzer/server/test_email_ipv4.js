import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    },
    // Sometimes 'host' with custom options gets ignored if not explicitly formatted.
    // Try forcing IPv4 natively.
    family: 4, 
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((err) => {
    if (err) console.error("FAILED:", err);
    else console.log("SUCCESS");
});
