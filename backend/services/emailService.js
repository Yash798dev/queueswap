const nodemailer = require('nodemailer');

// Use environment variables for real credentials
// For dev: Ethereal Email or console log if no credentials
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendVerificationEmail = async (email, token) => {
    const verificationLink = `http://localhost:4200/verify/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Queue Swap - Email Verification',
        html: `
      <h3>Welcome to Queue Swap!</h3>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `
    };

    try {
        if (!process.env.EMAIL_USER) {
            console.log('---------------------------------------------------');
            console.log('EMAIL SERVICE (Mock):');
            console.log(`To: ${email}`);
            console.log(`Link: ${verificationLink}`);
            console.log('---------------------------------------------------');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

exports.sendApprovalEmail = async (email, businessName, qrCodeDataURL) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Queue Swap - Business Approved',
        html: `
      <h3>Good News!</h3>
      <p>Your business <strong>${businessName}</strong> has been approved.</p>
      <p>You can now manage your queues on our platform.</p>
      <p>Here is your unique QR code:</p>
      <img src="cid:unique-qrcode" alt="Business QR Code" width="200" />
    `,
        attachments: [
            {
                filename: 'qrcode.png',
                content: qrCodeDataURL.split("base64,")[1],
                encoding: 'base64',
                cid: 'unique-qrcode' // referenced in the html img src
            }
        ]
    };

    await sendEmail(mailOptions);
};

exports.sendRejectionEmail = async (email, businessName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Queue Swap - Business Rejected',
        html: `
      <h3>Update on your request</h3>
      <p>We regret to inform you that your business <strong>${businessName}</strong> has been rejected.</p>
      <p>Please contact support for more details.</p>
    `
    };

    await sendEmail(mailOptions);
};

// Helper to avoid code duplication and handle mock sending
async function sendEmail(mailOptions) {
    try {
        if (!process.env.EMAIL_USER) {
            console.log('---------------------------------------------------');
            console.log(`EMAIL SERVICE (Mock) - Subject: ${mailOptions.subject}`);
            console.log(`To: ${mailOptions.to}`);
            console.log('---------------------------------------------------');
            return;
        }
        const transporter = require('nodemailer').createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${mailOptions.to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
