
import axios from 'axios';

/**
 * VERCEL-PROXY EMAIL SERVICE
 * 
 * Since Render blocks outbound SMTP (ETIMEDOUT), we route emails 
 * through a Vercel Serverless Function which acts as our private Email API.
 */

const sendViaVercelProxy = async (to, subject, html, replyTo = null) => {
    try {
        // Use the live Vercel URL for the API
        const vercelUrl = process.env.CLIENT_URL || 'https://resume-match-ai-phi.vercel.app';
        const proxyUrl = `${vercelUrl}/api/dispatchEmail`;

        console.log(`🌐 [Email] Routing via Vercel API: ${to}`);
        
        const response = await axios.post(proxyUrl, {
            to, subject, html, replyTo,
            key: 'resume_match_proxy_key_123'
        });

        if (response.data.success) {
            console.log(`✅ [Email] Delivered via Vercel for: ${to}`);
            return { success: true };
        } else {
            return { success: false, error: response.data.error };
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error(`❌ [Email] Vercel Proxy Failed for ${to}:`, errorMsg);
        return { success: false, error: errorMsg };
    }
};

/**
 * Core Sending Function
 */
const sendEmail = async (to, subject, html, replyTo = null) => {
    return sendViaVercelProxy(to, subject, html, replyTo);
};

/**
 * Template Helper
 */
const getHtmlTemplate = (title, message, buttonText, buttonUrl, details = [], seekerName = '') => {
    const detailRows = details.map(d => `
        <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 10px 0; font-size: 14px; color: #718096; width: 40%; font-weight: bold;">${d.label}</td>
            <td style="padding: 10px 0; font-size: 14px; color: ${d.color || '#2d3748'}; font-weight: 600;">${d.value}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 10px !important; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7fafc; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">ResumeMatch AI</h1>
                                <p style="color: #e0f2fe; margin-top: 10px; font-size: 14px; letter-spacing: 1px;">Intelligent Career Matching</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">Hi ${seekerName || 'there'},</h2>
                                <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                                    ${message}
                                </p>

                                ${details.length > 0 ? `
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                    ${detailRows}
                                </table>` : ''}

                                <div style="text-align: center; margin-top: 40px;">
                                    <a href="${buttonUrl}" style="background-color: #0ea5e9; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
                                        ${buttonText}
                                    </a>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #edf2f7;">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                    This is an automated notification from ResumeMatch AI.<br/>
                                    Please do not reply directly to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

/**
 * Public API
 */

export const sendStatusUpdateEmail = async (to, seekerName, jobTitle, status, note, replyTo = null) => {
    const statusMessages = {
        applied: `🎉 Great news! You've successfully applied for the position of <strong>${jobTitle}</strong>. We've notified the hiring team.`,
        screening: `🔍 Your application for <strong>${jobTitle}</strong> is currently being screened by our talent experts.`,
        interview: `📅 Congratulations! The hiring team for <strong>${jobTitle}</strong> would like to invite you for an interview.`,
        offer: `✨ Amazing news! An offer has been extended for the <strong>${jobTitle}</strong> role. Check your dashboard!`,
        rejected: `Thank you for your interest in the <strong>${jobTitle}</strong> position. While we won't be moving forward now, we'll keep your profile for future roles.`,
        withdrawn: `Your application for <strong>${jobTitle}</strong> has been successfully withdrawn.`
    };

    const colors = {
        applied: '#f59e0b', screening: '#10b981', interview: '#0ea5e9',
        offer: '#8b5cf6', rejected: '#f43f5e', withdrawn: '#64748b'
    };

    const statusColor = colors[status] || '#0ea5e9';
    let messageBody = statusMessages[status] || `Your application status for ${jobTitle} has been updated to "${status}".`;

    if (note) {
        messageBody += `<br/><br/><div style="padding: 15px; background-color: #f8fafc; border-left: 4px solid ${statusColor}; color: #334155; font-style: italic;">
            <strong>Recruiter Message:</strong><br/>"${note}"
        </div>`;
    }

    const details = [
        { label: 'Position', value: jobTitle },
        { label: 'New Status', value: status.toUpperCase(), color: statusColor },
        { label: 'Updated On', value: new Date().toLocaleDateString() }
    ];

    return sendEmail(to, `Update: ${jobTitle} Application`, getHtmlTemplate(
        'Application Update', messageBody, 'View Status', `${process.env.CLIENT_URL || 'https://resume-match-ai-phi.vercel.app'}/tracker`, details, seekerName
    ), replyTo);
};

export const sendRecruiterEmail = async ({ to, recruiterName, seekerName, jobTitle, event, coverLetter }) => {
    const events = {
        new_application: {
            title: 'New Applicant Detected',
            msg: `🚀 Exciting news! <strong>${seekerName}</strong> just applied for the <strong>${jobTitle}</strong> position.`
        },
        withdrawal: {
            title: 'Application Withdrawn',
            msg: `📢 Heads up! <strong>${seekerName}</strong> has withdrawn their application for the <strong>${jobTitle}</strong> position.`
        }
    };

    const config = events[event] || events.new_application;
    let finalMsg = config.msg;

    if (coverLetter) {
        finalMsg += `<br/><br/><div style="padding: 15px; background-color: #f1f5f9; border-radius: 8px; color: #475569; font-style: italic;">
            <strong>Candidate Message:</strong><br/>"${coverLetter}"
        </div>`;
    }

    const details = [
        { label: 'Role', value: jobTitle },
        { label: 'Applicant', value: seekerName },
        { label: 'Received', value: new Date().toLocaleDateString() }
    ];

    return sendEmail(to, `ResumeMatch AI: ${config.title}`, getHtmlTemplate(
        config.title, finalMsg, 'Review Candidate', `${process.env.CLIENT_URL || 'https://resume-match-ai-phi.vercel.app'}/recruiter-dashboard`, details, recruiterName
    ));
};

export const queueEmail = async (emailData) => {
    // Direct call for background processing
    return sendStatusUpdateEmail(emailData.to, emailData.name, emailData.jobTitle, emailData.status, emailData.note, emailData.replyTo);
};
