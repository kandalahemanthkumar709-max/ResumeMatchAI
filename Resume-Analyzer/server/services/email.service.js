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

const sendViaVercelProxy = async (to, subject, html, replyTo = null) => {
    try {
        const isLocal = process.env.NODE_ENV === 'development' || !process.env.CLIENT_URL || process.env.CLIENT_URL.includes('localhost');
        
        // 1. LOCAL/SMTP FALLBACK (Preferred for reliability and speed)
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            console.log(`📡 [SMTP] Sending email to ${to}...`);
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { 
                    user: process.env.GMAIL_USER.trim(), 
                    pass: process.env.GMAIL_PASS.trim() 
                }
            });

            await transporter.sendMail({
                from: `"ResumeMatch AI" <${process.env.GMAIL_USER}>`,
                to,
                subject,
                html,
                ...(replyTo && { replyTo })
            });

            console.log('✅ [SMTP] Email delivered successfully.');
            return true;
        }

        // 2. PRODUCTION PROXY (Only if direct SMTP is blocked)
        if (!isLocal) {
            console.log('🌐 [PROXY] Attempting delivery via Vercel...');
            const proxyUrl = `${process.env.CLIENT_URL}/api/sendMail`;
            await axios.post(proxyUrl, {
                to, subject, html, replyTo,
                key: 'resume_match_proxy_key_123'
            }, { timeout: 12000 });
            return true;
        }

        console.warn('⚠️  No email credentials found. Email skipped.');
        return true;

    } catch (err) {
        console.error("❌ Email service failed:", err.message);
        // Don't crash the whole app if email fails
        return false;
    }
};

const getHtmlTemplate = (title, message, btnText, btnLink, details = [], recipientName = '') => `
    <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; padding: 40px 20px; color: #f8fafc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.05);">
            <tr>
                <td align="center" style="padding: 40px; background: linear-gradient(135deg, ${details?.[2]?.color || '#0ea5e9'} 0%, #2563eb 100%);">
                    <div style="font-weight: 900; color: #ffffff; letter-spacing: -0.05em; font-size: 28px;">
                        ResumeMatch <span style="color: #67e8f9;">AI</span>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 48px 40px;">
                    <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${title}</h2>
                    
                    <div style="color: #94a3b8; font-size: 16px; margin-bottom: 24px;">
                        Hi ${recipientName || 'there'},
                    </div>

                    <div style="color: #cbd5e1; line-height: 1.8; font-size: 16px; margin-bottom: 32px;">
                        ${message}
                    </div>

                    ${details && details.length > 0 ? `
                    <div style="background-color: rgba(15, 23, 42, 0.5); border-radius: 20px; padding: 28px; margin-bottom: 36px; border: 1px solid rgba(255,255,255,0.05);">
                        <table width="100%" style="border-collapse: collapse;">
                            ${details.map(detail => `
                            <tr>
                                <td width="40%" style="padding: 10px 0; color: #64748b; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">${detail.label}</td>
                                <td width="60%" style="padding: 10px 0; color: ${detail.color || '#f8fafc'}; font-size: 14px; font-weight: 600; text-align: right;">${detail.value}</td>
                            </tr>
                            `).join('')}
                        </table>
                    </div>
                    ` : ''}

                    ${btnLink ? `
                    <div style="text-align: center;">
                        <a href="${btnLink}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #3b82f6); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.25);">
                            ${btnText}
                        </a>
                    </div>
                    ` : ''}
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 32px; background-color: #0f172a; color: #475569; font-size: 12px; font-weight: 500;">
                    <p style="margin: 0 0 12px 0;">Intelligence applied to your career journey.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ResumeMatch AI. <a href="${process.env.CLIENT_URL}" style="color: #0ea5e9; text-decoration: none; font-weight: 700;">Visit Platform</a></p>
                </td>
            </tr>
        </table>
    </div>
`;

export const sendStatusUpdateEmail = async (to, seekerName, jobTitle, status, note, replyTo = null) => {
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
    
    const colors = {
        applied: '#f59e0b',    // Amber
        pending: '#f59e0b',
        screening: '#10b981',  // Emerald
        interview: '#0ea5e9',  // Blue
        offer: '#8b5cf6',      // Purple
        rejected: '#f43f5e',   // Rose
        withdrawn: '#64748b'   // Slate
    };

    const statusColor = colors[status] || '#0ea5e9';

    if (note) {
        fullMessage += `<br/><br/><div style="padding: 15px; background-color: #f1f5f9; border-left: 4px solid ${statusColor}; color: #334155; font-style: italic;">
            <strong>Message from Recruiter:</strong><br/>
            "${note}"
        </div>`;
    }

    const seekerDetails = [
        { label: 'Applicant Name', value: seekerName },
        { label: 'Target Role', value: jobTitle },
        { label: 'Current Status', value: status.toUpperCase(), color: statusColor },
        { label: 'Last Updated', value: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
    ];

    try {
        await sendViaVercelProxy(to, `Update on your application for ${jobTitle}`, getHtmlTemplate(
            'Application Update',
            fullMessage,
            'View Dashboard',
            `${process.env.CLIENT_URL}/dashboard`,
            seekerDetails,
            seekerName
        ), replyTo);
        console.log(`📧 Email sent to ${to} via Vercel Proxy (Status: ${status})`);
    } catch (error) {
        console.error('❌ Email failed:', error.message);
    }
};

export const queueEmail = async (emailData) => {
    await sendStatusUpdateEmail(emailData.to, emailData.name, emailData.jobTitle, emailData.status, emailData.note, emailData.replyTo);
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
            recruiterDetails,
            recruiterName
        ));
        console.log(`📧 Recruiter Email sent to ${to} via Vercel Proxy (Event: ${event})`);
    } catch (error) {
        console.error('❌ Recruiter Email failed:', error.message);
    }
};
