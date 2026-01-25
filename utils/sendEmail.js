const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL || 'thevanityindia@gmail.com',
            pass: process.env.SMTP_PASSWORD // App Password
        },
        logger: true, // log info to console  
        debug: true   // include SMTP traffic in the logs
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
