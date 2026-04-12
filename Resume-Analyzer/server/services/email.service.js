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
            if (isLocal && (!err.response || err.response.status !== 500)) {
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

const getHtmlTemplate = (title, message, btnText, btnLink, details = []) => `
    <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
            <tr>
                <td align="left" style="padding: 32px 42px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
                    <div style="font-weight: 900; color: #0f172a; letter-spacing: -0.025em; font-size: 24px; display: inline-block; vertical-align: middle;">
                        ${process.env.VITE_APP_NAME || 'ResumeMatch AI'}
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 42px;">
                    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.0125em;">${title}</h2>
                    <div style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 28px;">
                        ${message}
                    </div>

                    ${details && details.length > 0 ? `
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
                        <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Key Details</h3>
                        <table width="100%" style="border-collapse: collapse;">
                            ${details.map(detail => `
                            <tr>
                                <td width="35%" style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">${detail.label}</td>
                                <td width="65%" style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">${detail.value}</td>
                            </tr>
                            `).join('')}
                        </table>
                    </div>
                    ` : ''}

                    ${btnLink ? `
                    <div>
                        <a href="${btnLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                            ${btnText} &rarr;
                        </a>
                    </div>
                    ` : ''}
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                    <p style="margin: 0 0 8px 0;">This is an automated notification from ${process.env.VITE_APP_NAME || 'ResumeMatch AI'}.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} All rights reserved. <a href="${process.env.CLIENT_URL}/help" style="color: #2563eb; text-decoration: none;">Help Support</a></p>
                </td>
            </tr>
        </table>
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

    const seekerDetails = [
        { label: 'Applicant Name', value: seekerName },
        { label: 'Target Role', value: jobTitle },
        { label: 'Current Status', value: status.toUpperCase() },
        { label: 'Last Updated', value: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
    ];

    try {
        await sendViaVercelProxy(to, `Update on your application for ${jobTitle}`, getHtmlTemplate(
            'Application Update',
            fullMessage,
            'View Dashboard',
            `${process.env.CLIENT_URL}/dashboard`,
            seekerDetails
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
            message: `<strong>Exciting news!</strong> <strong>${seekerName}</strong> has just thrown their hat in the ring for your <strong>${jobTitle}</strong> position.${coverLetter ? `<br/><br/><strong>Personal Note from Candidate:</strong><br/><div style="padding:15px;background:#f8fafc;border-left:4px solid #2563eb;color:#334155;font-style:italic;">"${coverLetter.slice(0, 400)}..."</div>` : '<br/><br/>They haven\'t included a cover letter yet, but their profile is ready for review.'}<br/>Jump into your dashboard to see how our AI ranked this match!`,
            btnText: 'View Candidate Match',
        },
        cover_letter_added: {
            subject: `📝 Extra Insight: ${seekerName} added a cover letter for "${jobTitle}"`,
            title: `New Cover Letter! 📝`,
            message: `<strong>${seekerName}</strong> is going the extra mile! They just added a personalized cover letter to their application for <strong>${jobTitle}</strong>.${coverLetter ? `<br/><br/><div style="padding:15px;background:#f8fafc;border-left:4px solid #2563eb;color:#334155;font-style:italic;">"${coverLetter.slice(0, 400)}..."</div>` : ''}`,
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

    const recruiterDetails = [
        { label: 'Hiring Manager', value: recruiterName || 'Hiring Team' },
        { label: 'Candidate Name', value: seekerName },
        { label: 'Requisition', value: jobTitle },
        { label: 'Event Type', value: event.replace('_', ' ').toUpperCase() },
        { label: 'Timestamp', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    ];

    try {
        await sendViaVercelProxy(to, template.subject, getHtmlTemplate(
            template.title,
            template.message,
            template.btnText,
            `${process.env.CLIENT_URL}/recruiter/dashboard`,
            recruiterDetails
        ));
        console.log(`📧 Recruiter Email sent to ${to} via Vercel Proxy (Event: ${event})`);
    } catch (error) {
        console.error('❌ Recruiter Email failed:', error.message);
    }
};
