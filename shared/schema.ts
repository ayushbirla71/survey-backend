import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

// Surveys table
export const surveys = sqliteTable("surveys", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull(), // 'draft', 'active', 'completed'
  questions: text("questions", { mode: 'json' }).notNull(),
  audienceCriteria: text("audience_criteria", { mode: 'json' }).notNull(),
  targetCount: integer("target_count").notNull(),
  htmlContent: text("html_content"), // Store HTML version of survey
  publicUrl: text("public_url"), // Public URL for survey access
  emailsSent: integer("emails_sent").default(0), // Track emails sent count
  emailsOpened: integer("emails_opened").default(0), // Track emails opened count
  responseCount: integer("response_count").default(0), // Track total responses
  createdAt: integer("created_at", { mode: 'timestamp' }),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

// Survey Responses table
export const surveyResponses = sqliteTable("survey_responses", {
  id: text("id").primaryKey(),
  surveyId: text("survey_id").references(() => surveys.id).notNull(),
  audienceMemberId: text("audience_member_id").references(() => audienceMembers.id),
  answers: text("answers", { mode: 'json' }).notNull(),
  completionTime: integer("completion_time"), // seconds
  submittedAt: integer("submitted_at", { mode: 'timestamp' }),
  ipAddress: text("ip_address"),
});

// Audience Members table
export const audienceMembers = sqliteTable("audience_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ageGroup: text("age_group"),
  gender: text("gender"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  industry: text("industry"),
  jobTitle: text("job_title"),
  education: text("education"),
  income: text("income"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  joinedDate: integer("joined_date", { mode: 'timestamp' }),
  lastActivity: integer("last_activity", { mode: 'timestamp' }),
  tags: text("tags", { mode: 'json' }),
  createdAt: integer("created_at", { mode: 'timestamp' }),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

// Audience Segments table
export const audienceSegments = sqliteTable("audience_segments", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: text("criteria", { mode: 'json' }).notNull(),
  memberCount: integer("member_count").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

// Email Campaign table - tracks when surveys are sent to audiences
export const emailCampaigns = sqliteTable("email_campaigns", {
  id: text("id").primaryKey(),
  surveyId: text("survey_id").references(() => surveys.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  campaignName: text("campaign_name").notNull(),
  recipientCount: integer("recipient_count").notNull(),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  openedCount: integer("opened_count").default(0),
  respondedCount: integer("responded_count").default(0),
  status: text("status").notNull().default("draft"), // draft, sending, completed, failed
  sentAt: integer("sent_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }),
});

// Email Recipients table - tracks individual email sends
export const emailRecipients = sqliteTable("email_recipients", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => emailCampaigns.id).notNull(),
  audienceMemberId: text("audience_member_id").references(() => audienceMembers.id).notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, opened, responded
  sentAt: integer("sent_at", { mode: 'timestamp' }),
  openedAt: integer("opened_at", { mode: 'timestamp' }),
  respondedAt: integer("responded_at", { mode: 'timestamp' }),
  errorMessage: text("error_message"),
  trackingId: text("tracking_id").notNull(), // unique ID for tracking opens
});

// Survey Tracking table - tracks when surveys are opened
export const surveyTracking = sqliteTable("survey_tracking", {
  id: text("id").primaryKey(),
  surveyId: text("survey_id").references(() => surveys.id).notNull(),
  recipientId: text("recipient_id").references(() => emailRecipients.id),
  trackingId: text("tracking_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  openedAt: integer("opened_at", { mode: 'timestamp' }),
  respondedAt: integer("responded_at", { mode: 'timestamp' }),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  submittedAt: true,
});

export const insertAudienceMemberSchema = createInsertSchema(audienceMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAudienceSegmentSchema = createInsertSchema(audienceSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
});

export const insertEmailRecipientSchema = createInsertSchema(emailRecipients).omit({
  id: true,
});

export const insertSurveyTrackingSchema = createInsertSchema(surveyTracking).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

export type AudienceMember = typeof audienceMembers.$inferSelect;
export type InsertAudienceMember = z.infer<typeof insertAudienceMemberSchema>;

export type AudienceSegment = typeof audienceSegments.$inferSelect;
export type InsertAudienceSegment = z.infer<typeof insertAudienceSegmentSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = z.infer<typeof insertEmailRecipientSchema>;

export type SurveyTracking = typeof surveyTracking.$inferSelect;
export type InsertSurveyTracking = z.infer<typeof insertSurveyTrackingSchema>;
