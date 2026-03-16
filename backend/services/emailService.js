// Google Apps Script Email Service
// Uses HTTP POST to a Google Apps Script Web App to send emails
// This bypasses SMTP restrictions on hosting platforms like Render

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

/**
 * Send an email via Google Apps Script
 * @param {string} toEmail - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML content of the email
 * @param {string|null} qrCodeBase64 - Optional base64-encoded QR code image (without data URL prefix)
 */
async function sendEmailViaGoogle(toEmail, subject, htmlBody, qrCodeBase64 = null) {
    if (!GOOGLE_SCRIPT_URL) {
        console.log('---------------------------------------------------');
        console.log(`EMAIL SERVICE (Mock) - Subject: ${subject}`);
        console.log(`To: ${toEmail}`);
        console.log('---------------------------------------------------');
        return;
    }

    const payload = {
        to: toEmail,
        subject: subject,
        htmlBody: htmlBody,
        qrCodeBase64: qrCodeBase64
    };

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        const result = await response.json();

        if (result.status === 'success') {
            console.log(`Email sent successfully to ${toEmail}`);
        } else {
            console.error('Google Script Error:', result.message);
        }
    } catch (error) {
        console.error('Failed to send email via Google Script:', error);
    }
}

// --- Exported Functions ---

exports.sendVerificationEmail = async (email, token) => {
    const verificationLink = `https://queueswap-backend.onrender.com/api/auth/verify/${token}`;

    const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f9f9fc; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Queue Swap</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px;">Verify Your Account</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Welcome to <strong>Queue Swap</strong>! We are excited to have you on board. Please verify your email address to complete your registration and get started.
    </p>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%); color: #ffffff; font-weight: bold; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">Verify Email Address</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
      If the button doesn't work, copy and paste the following link into your browser:<br>
      <a href="${verificationLink}" style="color: #4f46e5; word-break: break-all;">${verificationLink}</a>
    </p>
  </div>
  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
    <p>&copy; ${new Date().getFullYear()} Queue Swap. All rights reserved.</p>
  </div>
</div>
    `;

    await sendEmailViaGoogle(email, 'Queue Swap - Email Verification', htmlBody);
};

exports.sendApprovalEmail = async (email, businessName, qrCodeDataURL) => {
    const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f9f9fc; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #10b981; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Queue Swap</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 48px;">🎉</span>
    </div>
    <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px; text-align: center;">Business Approved!</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; text-align: center;">
      Congratulations! Your business <strong>${businessName}</strong> has been successfully approved.
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
      You can now start managing your queues seamlessly. Below is your official QR code for customers to join your queue easily.
    </p>
    <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 12px;">
      <p style="font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 15px; font-size: 15px;">Your Business QR Code</p>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">See attached/embedded image below.</p>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://queueswap-app.onrender.com/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-weight: bold; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Go to Dashboard</a>
    </div>
  </div>
  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
    <p>&copy; ${new Date().getFullYear()} Queue Swap. All rights reserved.</p>
  </div>
</div>
    `;

    // Extract the base64 data from the data URL (remove "data:image/png;base64," prefix)
    const qrCodeBase64 = qrCodeDataURL ? qrCodeDataURL.split("base64,")[1] : null;

    await sendEmailViaGoogle(email, 'Queue Swap - Business Approved', htmlBody, qrCodeBase64);
};

exports.sendRejectionEmail = async (email, businessName) => {
    const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fef2f2; border-radius: 12px; border: 1px solid #fee2e2;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #ef4444; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Queue Swap</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #ef4444;">
    <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 22px;">Update on your request</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      We regret to inform you that your business registration for <strong>${businessName}</strong> could not be approved at this time.
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      This may be due to incomplete information or not meeting our current platform requirements.
    </p>
    <div style="background-color: #f9fafb; border-left: 4px solid #d1d5db; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
        If you believe this was a mistake, or if you'd like to provide additional details, please reach out to our support team and we'll be happy to review your application again.
      </p>
    </div>
    <div style="text-align: center;">
      <a href="mailto:support@queueswap.com" style="display: inline-block; background-color: #e5e7eb; color: #374151; font-weight: bold; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 8px; transition: background-color 0.2s;">Contact Support</a>
    </div>
  </div>
</div>
    `;

    await sendEmailViaGoogle(email, 'Queue Swap - Business Rejected', htmlBody);
};
