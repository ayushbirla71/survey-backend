import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Surveys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      questions TEXT NOT NULL,
      audience_criteria TEXT NOT NULL,
      target_count INTEGER NOT NULL,
      html_content TEXT,
      public_url TEXT,
      emails_sent INTEGER DEFAULT 0,
      emails_opened INTEGER DEFAULT 0,
      response_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Survey Responses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      audience_member_id TEXT,
      answers TEXT NOT NULL,
      completion_time INTEGER,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      respondent_info TEXT,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    )
  `);

  // Audience Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audience_members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      age_group TEXT,
      gender TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      industry TEXT,
      job_title TEXT,
      education TEXT,
      income TEXT,
      is_active BOOLEAN DEFAULT 1,
      joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Audience Segments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audience_segments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      criteria TEXT NOT NULL,
      member_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Email Campaigns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      recipient_count INTEGER NOT NULL,
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      opened_count INTEGER DEFAULT 0,
      responded_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Email Recipients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_recipients (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      audience_member_id TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at DATETIME,
      opened_at DATETIME,
      responded_at DATETIME,
      error_message TEXT,
      tracking_id TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id),
      FOREIGN KEY (audience_member_id) REFERENCES audience_members(id)
    )
  `);

  // Survey Tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS survey_tracking (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      recipient_id TEXT,
      tracking_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      opened_at DATETIME,
      responded_at DATETIME,
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (recipient_id) REFERENCES email_recipients(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
    CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
    CREATE INDEX IF NOT EXISTS idx_surveys_category ON surveys(category);
    CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
    CREATE INDEX IF NOT EXISTS idx_audience_members_user_id ON audience_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_audience_members_email ON audience_members(email);
    CREATE INDEX IF NOT EXISTS idx_audience_segments_user_id ON audience_segments(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_survey_id ON email_campaigns(survey_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_recipients_campaign_id ON email_recipients(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_recipients_tracking_id ON email_recipients(tracking_id);
    CREATE INDEX IF NOT EXISTS idx_survey_tracking_survey_id ON survey_tracking(survey_id);
    CREATE INDEX IF NOT EXISTS idx_survey_tracking_tracking_id ON survey_tracking(tracking_id);
  `);
};

// Initialize database
createTables();

export default db;
