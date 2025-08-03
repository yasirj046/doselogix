const nodemailer = require('nodemailer');

/**
 * Send email utility function with graceful fallback
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    // Check if email is enabled
    const emailEnabled = process.env.EMAIL_ENABLED === 'true';
    
    if (!emailEnabled) {
      console.log('📧 EMAIL SIMULATION (Email disabled in development)');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text}`);
      console.log('---');
      
      // Return success for development
      return {
        messageId: 'dev-mode-' + Date.now(),
        status: 'simulated'
      };
    }

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email configuration missing. Add EMAIL_USER and EMAIL_PASSWORD to .env file');
      
      // Log email for debugging
      console.log('📧 EMAIL WOULD BE SENT:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${text}`);
      
      return {
        messageId: 'config-missing-' + Date.now(),
        status: 'config_missing'
      };
    }

    // Create transporter based on configuration
    let transporter;
    
    if (process.env.SMTP_HOST) {
      // Custom SMTP configuration
      transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      // Gmail configuration (default)
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    const mailOptions = {
      from: `"DMS Platform" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Log the email content for debugging even if sending fails
    console.log('📧 EMAIL THAT FAILED TO SEND:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    
    // Don't throw error in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Email failure ignored');
      return {
        messageId: 'dev-failed-' + Date.now(),
        status: 'dev_failed',
        error: error.message
      };
    }
    
    throw new Error('Failed to send email: ' + error.message);
  }
};

module.exports = sendEmail;
