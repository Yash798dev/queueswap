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
      <h3>Welcome to Queue Swap!</h3>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `;

    await sendEmailViaGoogle(email, 'Queue Swap - Email Verification', htmlBody);
};

exports.sendApprovalEmail = async (email, businessName, qrCodeDataURL) => {
    const htmlBody = `
      <h3>Good News!</h3>
      <p>Your business <strong>${businessName}</strong> has been approved.</p>
      <p>You can now manage your queues on our platform.</p>
      <p>Here is your unique QR code:</p>
    `;

    // Extract the base64 data from the data URL (remove "data:image/png;base64," prefix)
    const qrCodeBase64 = qrCodeDataURL ? qrCodeDataURL.split("base64,")[1] : null;

    await sendEmailViaGoogle(email, 'Queue Swap - Business Approved', htmlBody, qrCodeBase64);
};

exports.sendRejectionEmail = async (email, businessName) => {
    const htmlBody = `
      <h3>Update on your request</h3>
      <p>We regret to inform you that your business <strong>${businessName}</strong> has been rejected.</p>
      <p>Please contact support for more details.</p>
    `;

    await sendEmailViaGoogle(email, 'Queue Swap - Business Rejected', htmlBody);
};
