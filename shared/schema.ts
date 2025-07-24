import { pgTable, text, serial, integer, boolean, timestamp, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Surveys table
export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull(), // 'draft', 'active', 'completed'
  questions: json("questions").notNull(),
  audienceCriteria: json("audience_criteria").notNull(),
  targetCount: integer("target_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Survey Responses table
export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").primaryKey(),
  surveyId: uuid("survey_id").references(() => surveys.id).notNull(),
  audienceMemberId: uuid("audience_member_id").references(() => audienceMembers.id).notNull(),
  answers: json("answers").notNull(),
  completionTime: integer("completion_time"), // seconds
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Audience Members table
export const audienceMembers = pgTable("audience_members", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
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
  isActive: boolean("is_active").default(true),
  joinedDate: timestamp("joined_date").defaultNow(),
  lastActivity: timestamp("last_activity"),
  tags: json("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audience Segments table
export const audienceSegments = pgTable("audience_segments", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: json("criteria").notNull(),
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
