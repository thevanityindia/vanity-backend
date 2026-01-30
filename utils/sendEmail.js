const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    // Create transporter

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net', // Default to SendGrid or configured host
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: true,
        debug: true
    });

    // Define email options
    const mailOptions = {
        from: `"${process.env.FROM_NAME || 'The Vanity India'}" <${process.env.SMTP_EMAIL || 'thevanityindia@gmail.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
};

module.exports = sendEmail;