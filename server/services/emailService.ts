import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import db from "../database/database.js";
import { htmlSurveyService } from "./htmlService.js";

class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "birlaaaaaa706@gmail.com",
        pass: process.env.SMTP_PASS || "vypp tuch vhut skhq",
      },
    });
  }

  // Create email campaign and send survey emails with tracking
  async createCampaignAndSendEmails(
    survey: any,
    recipients: any[],
    campaignName: string,
    userId: string,
  ) {
    const campaignId = uuidv4();
    const currentTime = new Date().toISOString();

    // Create email campaign record
    const insertCampaign = db.prepare(`
      INSERT INTO email_campaigns (id, survey_id, user_id, campaign_name, recipient_count, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'sending', ?)
    `);

    insertCampaign.run(
      campaignId,
      survey.id,
      userId,
      campaignName,
      recipients.length,
      currentTime,
    );

    // Create recipient records first
    const insertRecipient = db.prepare(`
      INSERT INTO email_recipients (id, campaign_id, audience_member_id, email, tracking_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);

    const recipientRecords = [];
    for (const recipient of recipients) {
      const recipientId = uuidv4();
      const trackingId = uuidv4();

      insertRecipient.run(
        recipientId,
        campaignId,
        recipient.id,
        recipient.email,
        trackingId,
      );

      recipientRecords.push({
        id: recipientId,
        email: recipient.email,
        trackingId,
        audienceMember: recipient,
      });
    }

    // Send emails with tracking
    const results = await this.sendTrackedEmails(
      survey,
      recipientRecords,
      campaignId,
    );

    // Update campaign with results
    const updateCampaign = db.prepare(`
      UPDATE email_campaigns 
      SET sent_count = ?, failed_count = ?, status = ?, sent_at = ?
      WHERE id = ?
    `);

    const status = results.failed === 0 ? "completed" : "partially_failed";
    updateCampaign.run(
      results.sent,
      results.failed,
      status,
      currentTime,
      campaignId,
    );

    return {
      campaignId,
      ...results,
    };
  }

  // Send tracked emails to recipients
  async sendTrackedEmails(
    survey: any,
    recipientRecords: any[],
    campaignId: string,
  ) {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    const updateRecipient = db.prepare(`
      UPDATE email_recipients 
      SET status = ?, sent_at = ?, error_message = ?
      WHERE id = ?
    `);

    for (const recipient of recipientRecords) {
      try {
        // Generate email HTML using the HTML service
        const emailHtml = htmlSurveyService.generateEmailTemplate(
          survey,
          recipient.trackingId,
          `${recipient.audienceMember.firstName} ${recipient.audienceMember.lastName}`,
        );

        const mailOptions = {
          from: process.env.FROM_EMAIL || "noreply@surveys.com",
          to: recipient.email,
          subject: `Survey Invitation: ${survey.title}`,
          html: emailHtml,
        };
        await this.transporter.sendMail(mailOptions);
        if (process.env.NODE_ENV === "development") {
          // In development, just mark as sent without actually sending
          console.log(
            `[DEV] Would send email to ${recipient.email} with tracking ID: ${recipient.trackingId}`,
          );
          updateRecipient.run(
            "sent",
            new Date().toISOString(),
            null,
            recipient.id,
          );
          results.sent++;
        } else {
          // In production, actually send the email
          // await this.transporter.sendMail(mailOptions);
          updateRecipient.run(
            "sent",
            new Date().toISOString(),
            null,
            recipient.id,
          );
          results.sent++;
        }
      } catch (error: any) {
        console.error(
          `Failed to send email to ${recipient.email}:`,
          error.message,
        );
        updateRecipient.run("failed", null, error.message, recipient.id);
        results.failed++;
        results.errors.push(`${recipient.email}: ${error.message}`);
      }
    }

    return results;
  }

  // Get campaign analytics
  async getCampaignAnalytics(campaignId: string) {
    const campaign = db
      .prepare("SELECT * FROM email_campaigns WHERE id = ?")
      .get(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const recipients = db
      .prepare(
        `
      SELECT er.*, am.first_name, am.last_name 
      FROM email_recipients er
      LEFT JOIN audience_members am ON er.audience_member_id = am.id
      WHERE er.campaign_id = ?
      ORDER BY er.sent_at DESC
    `,
      )
      .all(campaignId);

    const stats = {
      total: recipients.length,
      sent: recipients.filter(
        (r) =>
          r.status === "sent" ||
          r.status === "opened" ||
          r.status === "responded",
      ).length,
      failed: recipients.filter((r) => r.status === "failed").length,
      opened: recipients.filter(
        (r) => r.status === "opened" || r.status === "responded",
      ).length,
      responded: recipients.filter((r) => r.status === "responded").length,
      openRate: 0,
      responseRate: 0,
    };

    if (stats.sent > 0) {
      stats.openRate = Math.round((stats.opened / stats.sent) * 100);
      stats.responseRate = Math.round((stats.responded / stats.sent) * 100);
    }

    return {
      campaign,
      recipients,
      stats,
    };
  }

  async sendTestEmail() {
    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@survey.com",
        to: "test@example.com",
        subject: "Test Email",
        text: "This is a test email from the survey platform.",
      });
      return true;
    } catch (error) {
      console.error("Email test failed:", error);
      return false;
    }
  }
}

const emailService = new EmailService();

// Export function for bulk survey emails
export async function sendBulkSurveyEmails(
  surveyId: string,
  selectedAudience: any[],
  campaignName: string,
  survey: any,
) {
  // Get the default user ID
  const userId = process.env.USER_ID || "default-user";

  return await emailService.createCampaignAndSendEmails(
    survey,
    selectedAudience,
    campaignName,
    userId,
  );
}

export default emailService;
