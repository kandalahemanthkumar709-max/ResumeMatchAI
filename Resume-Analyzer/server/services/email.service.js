import nodemailer from 'nodemailer';

/**
 * EMAIL SERVICE
 * 
 * Gmail SMTP Configuration:
 * Why "App Password"? 
 * Google has disabled "Less Secure Apps". Regular passwords WILL NOT WORK.
 * 
 * SETUP STEPS:
 * 1. Go to your Google Account (myaccount.google.com)
 * 2. Go to Security -> 2-Step Verification (Must be ON)
 * 3. Search for "App Passwords"
 * 4. Create a new App Password for "Mail" and "Windows Computer/Mac"
 * 5. Update your .env with GMAIL_USER and GMAIL_PASS (the 16-character code)
 */

/**
 * HTML EMAIL TEMPLATE
 * Why Tables? Email clients like Outlook don't support modern CSS (flex, grid).
 * Inline CSS ONLY! External stylesheets are ignored.
 */
const getHtmlTemplate = (title, message, btnText, btnLink) => `
    <div style="font-family: sans-serif; background-color: #f4f7f9; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
            <tr>
                <td align="center" style="padding: 40px 0; background: linear-gradient(to right, #06b6d4, #2563eb);">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">ResumeMatch AI</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px;">
                    <h2 style="color: #1e293b; margin-bottom: 20px;">${title}</h2>
                    <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                        ${message}
                    </p>
                    ${btnLink ? `
                    <div style="margin-top: 40px; text-align: center;">
                        <a href="${btnLink}" style="background-color: #06b6d4; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            ${btnText}
                        </a>
                    </div>
                    ` : ''}
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 20px; background-color: #f8fafc; color: #94a3b8; font-size: 12px;">
                    © 2026 ResumeMatch AI. All rights reserved.
                </td>
            </tr>
        </table>
    </div>
`;

export const sendStatusUpdateEmail = async (to, seekerName, jobTitle, status, note) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS, 
        },
    });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error('❌ EMAIL ERROR: GMAIL_USER or GMAIL_PASS is missing in .env');
    }

    const statusMessages = {
        applied: `Your application for <strong>${jobTitle}</strong> has been successfully submitted. The recruiter will review it shortly.`,
        screening: `Great news, ${seekerName}! Your application for <strong>${jobTitle}</strong> is now in the <strong>Screening</strong> phase. The team is reviewing your profile closely.`,
        interview: `Congratulations! You have been invited for an <strong>Interview</strong> for the ${jobTitle} position. Expect a calendar invite soon.`,
        offer: `Amazing news! An <strong>Offer</strong> is being prepared for the ${jobTitle} role. Check your dashboard for details!`,
        rejected: `Thank you for your interest in the ${jobTitle} position. After careful review, the team has decided to move forward with other candidates. We wish you the best in your search.`,
        withdrawn: `As requested, your application for ${jobTitle} has been withdrawn.`
    };

    let fullMessage = statusMessages[status] || `Your application status has been updated to ${status}.`;
    
    // Add the personal recruiter note if provided
    if (note) {
        fullMessage += `<br/><br/><div style="padding: 15px; background-color: #f1f5f9; border-left: 4px solid #06b6d4; color: #334155; font-style: italic;">
            <strong>Message from Recruiter:</strong><br/>
            "${note}"
        </div>`;
    }

    const mailOptions = {
        from: `"ResumeMatch AI" <${process.env.GMAIL_USER}>`,
        to,
        subject: `Update on your application for ${jobTitle}`,
        html: getHtmlTemplate(
            'Application Update',
            fullMessage,
            'View Dashboard',
            `${process.env.CLIENT_URL}/dashboard`
        ),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to} (Status: ${status})`);
    } catch (error) {
        console.error('❌ Email failed:', error.message);
    }
};

/**
 * EMAIL QUEUE CONCEPT
 * In a production app, you would save these emails to a "Queue" (like RabbitMQ or Bull)
 * and have a separate process send them. 
 * This ensures your API remains fast even if Gmail's servers are slow.
 */
export const queueEmail = async (emailData) => {
    // For now, we send synchronously, but this is the hook for a real Queue
    await sendStatusUpdateEmail(emailData.to, emailData.name, emailData.jobTitle, emailData.status, emailData.note);
};

/**
 * RECRUITER EMAIL 
 * Sends email to the recruiter about candidate activity on their job posting.
 */
export const sendRecruiterEmail = async ({ to, recruiterName, seekerName, jobTitle, event, coverLetter }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.warn('⚠️  Recruiter email skipped: GMAIL credentials missing in .env');
        return;
    }

    const events = {
        new_application: {
            subject: `🚀 New Application: ${seekerName} for "${jobTitle}"`,
            title: `New Applicant 🚀`,
            message: `<strong>${seekerName}</strong> has just applied for your <strong>${jobTitle}</strong> position.${coverLetter ? `<br/><br/><strong>Candidate Message:</strong><br/><div style="padding:15px;background:#f1f5f9;border-left:4px solid #06b6d4;color:#334155;font-style:italic;">"${coverLetter.slice(0, 400)}..."</div>` : '<br/><br/>No cover letter was provided.'}<br/>Log in to review their full profile and AI match score.`,
            btnText: 'Review Applicant',
        },
        cover_letter_added: {
            subject: `📝 Cover Letter Added: ${seekerName} for "${jobTitle}"`,
            title: `Cover Letter Received 📝`,
            message: `<strong>${seekerName}</strong> has updated their application for <strong>${jobTitle}</strong> by adding a personalized cover letter.${coverLetter ? `<br/><br/><div style="padding:15px;background:#f1f5f9;border-left:4px solid #06b6d4;color:#334155;font-style:italic;">"${coverLetter.slice(0, 400)}..."</div>` : ''}`,
            btnText: 'View Full Application',
        },
        withdrawal: {
            subject: `Application Withdrawn: ${seekerName} withdrew from "${jobTitle}"`,
            title: `Application Withdrawn`,
            message: `<strong>${seekerName}</strong> has withdrawn their application for the <strong>${jobTitle}</strong> position. Their profile has been updated accordingly.`,
            btnText: 'View Candidates',
        },
    };

    const template = events[event];
    if (!template) return;

    const mailOptions = {
        from: `"ResumeMatch AI" <${process.env.GMAIL_USER}>`,
        to,
        subject: template.subject,
        html: getHtmlTemplate(
            template.title,
            template.message,
            template.btnText,
            `${process.env.CLIENT_URL}/recruiter/dashboard`
        ),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Recruiter email sent to ${to} (Event: ${event})`);
    } catch (error) {
        console.error('❌ Recruiter email failed:', error.message);
    }
};
