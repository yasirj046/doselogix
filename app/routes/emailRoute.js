const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const sendEmail = require('../util/sendEmail');

// Email configuration controller
const emailController = {
  // Test email configuration
  testEmail: async (req, res) => {
    try {
      const { testEmail: recipientEmail } = req.body;
      const userEmail = recipientEmail || req.user.email;

      const subject = 'DMS Platform - Email Test';
      const text = 'This is a test email from DMS Platform. If you received this, your email configuration is working correctly!';
      const html = `
        <h2>🎉 Email Test Successful!</h2>
        <p>This is a test email from <strong>DMS Platform</strong>.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Test sent at: ${new Date().toLocaleString()}</p>
        <hr>
        <p><small>DMS Platform - Pharmaceutical Distribution Management System</small></p>
      `;

      const result = await sendEmail(userEmail, subject, text, html);

      res.status(200).json({
        status: 'success',
        message: 'Test email sent successfully',
        data: {
          recipient: userEmail,
          messageId: result.messageId,
          emailStatus: result.status || 'sent'
        }
      });

    } catch (error) {
      console.error('Test email failed:', error);
      res.status(200).json({
        status: 'info',
        message: 'Test email completed with issues',
        data: {
          error: error.message,
          note: 'This may be due to missing email configuration. Check server logs for details.'
        }
      });
    }
  },

  // Get email configuration status
  getEmailStatus: async (req, res) => {
    try {
      const emailEnabled = process.env.EMAIL_ENABLED === 'true';
      const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
      
      res.status(200).json({
        status: 'success',
        data: {
          emailEnabled,
          hasConfiguration: hasEmailConfig,
          smtpHost: process.env.SMTP_HOST || 'gmail (default)',
          smtpPort: process.env.SMTP_PORT || '587',
          emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2}).*(@.*)/, '$1***$2') : 'Not configured',
          status: emailEnabled && hasEmailConfig ? 'ready' : 'needs_configuration'
        }
      });
    } catch (error) {
      console.error('Get email status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get email status'
      });
    }
  },

  // Get email setup instructions
  getSetupInstructions: async (req, res) => {
    try {
      const instructions = {
        title: 'Email Configuration Setup',
        steps: [
          {
            step: 1,
            title: 'Create Gmail App Password',
            description: 'Go to your Gmail account settings and create an App Password',
            url: 'https://support.google.com/accounts/answer/185833'
          },
          {
            step: 2,
            title: 'Update Environment Variables',
            description: 'Add the following to your .env file:',
            code: `EMAIL_ENABLED=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587`
          },
          {
            step: 3,
            title: 'Restart Server',
            description: 'Restart your server to apply the changes'
          },
          {
            step: 4,
            title: 'Test Configuration',
            description: 'Use the test email endpoint to verify everything works'
          }
        ],
        alternativeProviders: [
          {
            name: 'SendGrid',
            config: {
              SMTP_HOST: 'smtp.sendgrid.net',
              SMTP_PORT: '587',
              EMAIL_USER: 'apikey',
              EMAIL_PASSWORD: 'your-sendgrid-api-key'
            }
          },
          {
            name: 'Outlook/Hotmail',
            config: {
              SMTP_HOST: 'smtp-mail.outlook.com',
              SMTP_PORT: '587',
              EMAIL_USER: 'your-email@outlook.com',
              EMAIL_PASSWORD: 'your-password'
            }
          }
        ]
      };

      res.status(200).json({
        status: 'success',
        data: instructions
      });
    } catch (error) {
      console.error('Get setup instructions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get setup instructions'
      });
    }
  }
};

// Protected routes (require authentication)
router.use(authenticate);

// Email management routes
router.post('/test', emailController.testEmail);
router.get('/status', emailController.getEmailStatus);
router.get('/setup-instructions', emailController.getSetupInstructions);

module.exports = router;
