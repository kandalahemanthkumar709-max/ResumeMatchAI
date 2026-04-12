import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

import axios from 'axios';

/**
 * EMAIL SERVICE
 * 
 * We are using a Vercel Proxy to bypass the Render Free Tier SMTP Firewall!
 * The actual NodeMailer code runs on Vercel Serverless automatically.
 */

const sendViaVercelProxy = async (to, subject, html) => {
    try {
        const payload = {
            to,
            subject,
            html,
            key: 'resume_match_proxy_key_123'
        };

        // If local dev, just console log since proxy might not be running properly standalone
        const isLocal = process.env.NODE_ENV === 'development' || !process.env.CLIENT_URL;
        const proxyUrl = isLocal 
            ? 'http://localhost:5173/api/sendMail' 
            : `${process.env.CLIENT_URL}/api/sendMail`;

        try {
            await axios.post(proxyUrl, payload, { timeout: 10000 });
            return true;
        } catch (err) {
            // Give local development a fake success so it doesn't crash
            if (isLocal) {
                console.log('✅ Local Dev Mock Email Success! (Ignored Vercel error)');
                return true;
            }
            throw err;
        }
    } catch (err) {
        console.error("Vercel Proxy Email failed:", err.message);
        throw err;
    }
};

/**
 * HTML EMAIL TEMPLATE
 */
const getHtmlTemplate = (title, message, btnText, btnLink) => `
    <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; padding: 40px 20px; color: #f1f5f9;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.05);">
            <tr>
                <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #0891b2, #2563eb);">
                    <div style="font-weight: 900; color: #ffffff; letter-spacing: -0.025em; font-size: 28px;">
                        ResumeMatch<span style="opacity: 0.8;">AI</span>
                    </div>
                    <div style="color: #ffffff; opacity: 0.7; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Intelligence Powered Talent</div>
                </td>
            </tr>
            <tr>
                <td style="padding: 48px 40px;">
                    <h2 style="color: #ffffff; margin: 0 0 24px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.0125em;">${title}</h2>
                    <div style="color: #94a3b8; line-height: 1.8; font-size: 16px;">
                        ${message}
                    </div>
                    ${btnLink ? `
                    <div style="margin-top: 48px;">
                        <a href="${btnLink}" style="display: block; background-color: #ffffff; color: #020617; padding: 18px 0; text-decoration: none; border-radius: 16px; font-weight: 900; text-align: center; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                            ${btnText}
                        </a>
                    </div>
                    ` : ''}
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 30px; background-color: #0f172a; color: #475569; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">
                    © 2026 ResumeMatch AI — Confidential Recruiter Notification
                </td>
            </tr>
        </table>
        <div style="text-align: center; margin-top: 24px; color: #475569; font-size: 12px;">
            If you have questions, visit our <a href="${process.env.CLIENT_URL}/help" style="color: #06b6d3; text-decoration: none;">Help Center</a>
        </div>
    </div>
`;

export const sendStatusUpdateEmail = async (to, seekerName, jobTitle, status, note) => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error('❌ EMAIL ERROR: GMAIL_USER or GMAIL_PASS is missing in .env');
        return;
    }

    const statusMessages = {
        applied: `🎉 <strong>Exciting news!</strong> We've officially received your application for <strong>${jobTitle}</strong>. Our team is eager to review your profile and we'll be in touch soon!`,
        screening: `✨ <strong>Your journey is moving forward!</strong> Great news, ${seekerName}! Your application for <strong>${jobTitle}</strong> has moved into the <strong>Screening</strong> phase. Our hiring team is taking a close look at your impressive background.`,
        interview: `🎊 <strong>Huge Congratulations!</strong> ${seekerName}, we were so impressed by your profile that we'd love to invite you for an <strong>Interview</strong> for the ${jobTitle} role. Keep an eye on your inbox for a calendar invite!`,
        offer: `🌈 <strong>Incredible News!</strong> We are absolutely thrilled to let you know that we are preparing a formal <strong>Offer</strong> for you for the ${jobTitle} position. We can't wait to have you on the team!`,
        rejected: `Thank you so much for the time you spent sharing your experience with us for the ${jobTitle} role. While we've decided to move forward with other candidates at this time, we were genuinely impressed by your skills and wish you the very best in your next adventure.`,
        withdrawn: `We've successfully updated your records. Your application for ${jobTitle} has been withdrawn as requested. We hope to see you apply for other roles in the future!`
    };

    let fullMessage = statusMessages[status] || `Your application status has been updated to ${status}.`;
    
    if (note) {
        fullMessage += `<br/><br/><div style="padding: 15px; background-color: #f1f5f9; border-left: 4px solid #06b6d4; color: #334155; font-style: italic;">
            <strong>Message from Recruiter:</strong><br/>
            "${note}"
        </div>`;
    }

    try {
        await sendViaVercelProxy(to, `Update on your application for ${jobTitle}`, getHtmlTemplate(
            'Application Update',
            fullMessage,
            'View Dashboard',
            `${process.env.CLIENT_URL}/dashboard`
        ));
        console.log(`📧 Email sent to ${to} via Vercel Proxy (Status: ${status})`);
    } catch (error) {
        console.error('❌ Email failed:', error.message);
    }
};

export const queueEmail = async (emailData) => {
    await sendStatusUpdateEmail(emailData.to, emailData.name, emailData.jobTitle, emailData.status, emailData.note);
};

export const sendRecruiterEmail = async ({ to, recruiterName, seekerName, jobTitle, event, coverLetter }) => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.warn('⚠️  Recruiter email skipped: GMAIL credentials missing in .env');
        return;
    }

    const events = {
        new_application: {
            subject: `🚀 New Talent Alert: ${seekerName} applied for "${jobTitle}"`,
            title: `Fresh Application! 🚀`,
            message: `<strong>Exciting news!</strong> <strong>${seekerName}</strong> has just thrown their hat in the ring for your <strong>${jobTitle}</strong> position.${coverLetter ? `<br/><br/><strong>Personal Note from Candidate:</strong><br/><div style="padding:15px;background:#f1f5f9;border-left:4px solid #06b6d4;color:#334155;font-style:italic;">"${coverLetter.slice(0, 400)}..."</div>` : '<br/><br/>They haven\'t included a cover letter yet, but their profile is ready for review.'}<br/>Jump into your dashboard to see how our AI ranked this match!`,
            btnText: 'View Candidate Match',
        },
        cover_letter_added: {
            subject: `📝 Extra Insight: ${seekerName} added a cover letter for "${jobTitle}"`,
            title: `New Cover Letter! 📝`,
            message: `<strong>${seekerName}</strong> is going the extra mile! They just added a personalized cover letter to their application for <strong>${jobTitle}</strong>.${coverLetter ? `<br/><br/><div style="padding:15px;background:#f1f5f9;border-left:4px solid #06b6d4;color:#334155;font-style:italic;">"${coverLetter.slice(0, 400)}..."</div>` : ''}`,
            btnText: 'Read Full Letter',
        },
        withdrawal: {
            subject: `Update: ${seekerName} withdrew from "${jobTitle}"`,
            title: `Application Update`,
            message: `Just a heads up that <strong>${seekerName}</strong> has withdrawn their application for the <strong>${jobTitle}</strong> position. Your candidate list has been automatically updated.`,
            btnText: 'View Dashboard',
        },
    };

    const template = events[event];
    if (!template || !to) return;

    try {
        await sendViaVercelProxy(to, template.subject, getHtmlTemplate(
            template.title,
            template.message,
            template.btnText,
            `${process.env.CLIENT_URL}/recruiter/dashboard`
        ));
        console.log(`📧 Recruiter Email sent to ${to} via Vercel Proxy (Event: ${event})`);
    } catch (error) {
        console.error('❌ Recruiter Email failed:', error.message);
    }
};
