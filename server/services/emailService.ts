import nodemailer from 'nodemailer';

class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
  }

  async sendSurveyEmail(recipients: any[], survey: any) {
    const surveyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/survey/${survey.id}`;
    
    const emailTemplate = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">You're Invited to Participate in a Survey</h2>
            
            <h3>${survey.title}</h3>
            <p>${survey.description}</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Category:</strong> ${survey.category}</p>
              <p><strong>Estimated Time:</strong> 5-10 minutes</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${surveyUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Take Survey Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              This survey is anonymous and your responses will be kept confidential.
              If you have any questions, please contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">
              Survey Platform | Powered by Your Organization
            </p>
          </div>
        </body>
      </html>
    `;

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of recipients) {
      try {
        await this.transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@survey.com',
          to: recipient.email,
          subject: `Survey Invitation: ${survey.title}`,
          html: emailTemplate
        });
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${recipient.email}: ${error.message}`);
      }
    }

    return results;
  }

  async sendTestEmail() {
    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@survey.com',
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email from the survey platform.'
      });
      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}

export default new EmailService();
