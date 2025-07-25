import { v4 as uuidv4 } from "uuid";
import db from "./database/database.js";

// Database-backed storage implementation
export interface IStorage {
  // User methods
  getUser(id: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Survey methods
  getSurveys(filters: any): Promise<{ surveys: any[]; total: number }>;
  getSurvey(id: string): Promise<any | undefined>;
  createSurvey(survey: any): Promise<any>;
  updateSurvey(id: string, updates: any): Promise<any>;
  deleteSurvey(id: string): Promise<void>;
  duplicateSurvey(id: string): Promise<any>;

  // HTML Survey methods
  createSurveyHtml(surveyId: string, htmlContent: string): Promise<any>;
  getSurveyHtml(surveyId: string): Promise<string | undefined>;
  updateSurveyStats(
    surveyId: string,
    stats: {
      emailsSent?: number;
      emailsOpened?: number;
      responseCount?: number;
    },
  ): Promise<void>;

  // Survey response methods
  getSurveyResponses(
    surveyId: string,
    filters: any,
  ): Promise<{ responses: any[]; total: number }>;
  createSurveyResponse(response: any): Promise<any>;
  getSurveyResults(surveyId: string): Promise<any>;

  // Audience methods
  getAudienceMembers(filters: any): Promise<{ members: any[]; total: number }>;
  getAudienceMember(id: string): Promise<any | undefined>;
  createAudienceMember(member: any): Promise<any>;
  createAudienceMembers(
    members: any[],
  ): Promise<{ imported: number; skipped: number; errors: string[] }>;
  getAudienceStats(): Promise<any>;

  // Audience segment methods
  getAudienceSegments(): Promise<any[]>;
  createAudienceSegment(segment: any): Promise<any>;

  // Dashboard methods
  getDashboardStats(): Promise<any>;
  getDashboardCharts(): Promise<any>;
  getRecentSurveys(): Promise<any[]>;

  // Categories
  getCategories(): Promise<string[]>;

  // Email campaign methods
  getEmailCampaigns(surveyId?: string): Promise<any[]>;
  getEmailCampaign(campaignId: string): Promise<any | undefined>;
  getCampaignAnalytics(campaignId: string): Promise<any>;

  // Email tracking methods
  trackEmailOpen(
    trackingId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void>;
  trackSurveyAccess(
    surveyId: string,
    trackingId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to handle different date formats
  private formatDate(dateValue: any): string {
    if (!dateValue) return new Date().toISOString().split("T")[0];
    
    // If it's a number (Unix timestamp)
    if (typeof dateValue === 'number') {
      return new Date(dateValue).toISOString().split("T")[0];
    }
    
    // If it's a string
    if (typeof dateValue === 'string') {
      // If it looks like a Unix timestamp string
      if (/^\d+$/.test(dateValue)) {
        return new Date(parseInt(dateValue)).toISOString().split("T")[0];
      }
      // Otherwise treat as ISO date string
      return new Date(dateValue).toISOString().split("T")[0];
    }
    
    return new Date().toISOString().split("T")[0];
  }
  // User methods
  async getUser(id: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(id);
  }

  async getUserByEmail(email: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    return stmt.get(email);
  }

  async createUser(user: any) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, user.email, user.passwordHash, user.firstName, user.lastName);
    return this.getUser(id);
  }

  // Survey methods
  async getSurveys(filters: any) {
    let query = "SELECT * FROM surveys WHERE 1=1";
    const params: any[] = [];

    if (filters.search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.category) {
      query += " AND category = ?";
      params.push(filters.category);
    }

    // Count total
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as count");
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult.count;

    // Add pagination
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(filters.limit, (filters.page - 1) * filters.limit);

    const surveys = db.prepare(query).all(...params);

    // Parse JSON fields and add response counts
    const enrichedSurveys = surveys.map((survey) => {
      const responseCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ?",
        )
        .get(survey.id);

      return {
        ...survey,
        questions: JSON.parse(survey.questions),
        audienceCriteria: JSON.parse(survey.audience_criteria),
        responses: responseCount.count,
        completionRate:
          survey.target_count > 0
            ? Math.round((responseCount.count / survey.target_count) * 100)
            : 0,
        createdAt: survey.created_at,
        updatedAt: survey.updated_at,
      };
    });

    return { surveys: enrichedSurveys, total };
  }

  async getSurvey(id: string) {
    const stmt = db.prepare("SELECT * FROM surveys WHERE id = ?");
    const survey = stmt.get(id);

    if (!survey) return undefined;

    const responseCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ?",
      )
      .get(id);

    return {
      ...survey,
      questions: JSON.parse(survey.questions),
      audience: JSON.parse(survey.audience_criteria),
      responses: responseCount.count,
      target: survey.target_count,
      completionRate:
        survey.target_count > 0
          ? Math.round((responseCount.count / survey.target_count) * 100)
          : 0,
      createdAt: survey.created_at,
      updatedAt: survey.updated_at,
    };
  }

  async createSurvey(survey: any) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO surveys (id, user_id, title, description, category, status, questions, audience_criteria, target_count, emails_sent, emails_opened, response_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      survey.userId || process.env.USER_ID || uuidv4(), // Default user for now
      survey.title,
      survey.description,
      survey.category,
      survey.status || "draft",
      JSON.stringify(survey.questions),
      JSON.stringify(survey.audience || {}),
      survey.targetCount || 100,
      0, // emails_sent
      0, // emails_opened
      0, // response_count
    );

    return {
      id,
      title: survey.title,
      status: survey.status || "draft",
      createdAt: new Date().toISOString(),
    };
  }

  async updateSurvey(id: string, updates: any) {
    const setClause = [];
    const params = [];

    if (updates.title) {
      setClause.push("title = ?");
      params.push(updates.title);
    }
    if (updates.description) {
      setClause.push("description = ?");
      params.push(updates.description);
    }
    if (updates.status) {
      setClause.push("status = ?");
      params.push(updates.status);
    }
    if (updates.questions) {
      setClause.push("questions = ?");
      params.push(JSON.stringify(updates.questions));
    }

    setClause.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const stmt = db.prepare(
      `UPDATE surveys SET ${setClause.join(", ")} WHERE id = ?`,
    );
    stmt.run(...params);

    return {
      id,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteSurvey(id: string) {
    try {
      // Disable foreign key constraints temporarily
      db.pragma('foreign_keys = OFF');
      
      // Delete survey responses first
      db.prepare("DELETE FROM survey_responses WHERE survey_id = ?").run(id);
      
      // Delete from survey_tracking if exists
      try {
        db.prepare("DELETE FROM survey_tracking WHERE survey_id = ?").run(id);
      } catch (e) { /* Table might not exist */ }
      
      // Delete from email_recipients if exists
      try {
        db.prepare("DELETE FROM email_recipients WHERE survey_id = ?").run(id);
      } catch (e) { /* Table might not exist */ }
      
      // Delete from email_campaigns if exists
      try {
        db.prepare("DELETE FROM email_campaigns WHERE survey_id = ?").run(id);
      } catch (e) { /* Table might not exist */ }
      
      // Finally delete the survey
      const result = db.prepare("DELETE FROM surveys WHERE id = ?").run(id);
      
      // Re-enable foreign key constraints
      db.pragma('foreign_keys = ON');
      
      if (result.changes === 0) {
        throw new Error("Survey not found");
      }
    } catch (error) {
      // Re-enable foreign key constraints on error
      db.pragma('foreign_keys = ON');
      throw error;
    }
  }

  async duplicateSurvey(id: string) {
    const original = await this.getSurvey(id);
    if (!original) throw new Error("Survey not found");

    const newId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO surveys (id, user_id, title, description, category, status, questions, audience_criteria, target_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      original.user_id,
      `${original.title} (Copy)`,
      original.description,
      original.category,
      "draft",
      JSON.stringify(original.questions),
      JSON.stringify(original.audience),
      original.target,
    );

    return await this.getSurvey(newId);
  }

  // HTML Survey methods
  async createSurveyHtml(surveyId: string, htmlContent: string) {
    const publicUrl = process.env.BASE_URL + `/survey/${surveyId}`;
    const stmt = db.prepare(`
      UPDATE surveys 
      SET html_content = ?, public_url = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    stmt.run(htmlContent, publicUrl, surveyId);

    return {
      surveyId,
      publicUrl,
      htmlContent,
      updatedAt: new Date().toISOString(),
    };
  }

  async getSurveyHtml(surveyId: string) {
    const stmt = db.prepare("SELECT html_content FROM surveys WHERE id = ?");
    const result = stmt.get(surveyId);
    return result?.html_content;
  }

  async updateSurveyStats(
    surveyId: string,
    stats: {
      emailsSent?: number;
      emailsOpened?: number;
      responseCount?: number;
    },
  ) {
    const setClauses = [];
    const params = [];

    if (stats.emailsSent !== undefined) {
      setClauses.push("emails_sent = ?");
      params.push(stats.emailsSent);
    }

    if (stats.emailsOpened !== undefined) {
      setClauses.push("emails_opened = ?");
      params.push(stats.emailsOpened);
    }

    if (stats.responseCount !== undefined) {
      setClauses.push("response_count = ?");
      params.push(stats.responseCount);
    }

    if (setClauses.length === 0) return;

    setClauses.push("updated_at = CURRENT_TIMESTAMP");
    params.push(surveyId);

    const stmt = db.prepare(
      `UPDATE surveys SET ${setClauses.join(", ")} WHERE id = ?`,
    );
    stmt.run(...params);
  }

  // Survey response methods
  async getSurveyResponses(surveyId: string, filters: any) {
    let query = "SELECT * FROM survey_responses WHERE survey_id = ?";
    const params = [surveyId];

    // Count total
    const totalResult = db
      .prepare(
        "SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ?",
      )
      .get(surveyId);
    const total = totalResult.count;

    // Add pagination
    query += " ORDER BY submitted_at DESC LIMIT ? OFFSET ?";
    params.push(filters.limit, (filters.page - 1) * filters.limit);

    const responses = db.prepare(query).all(...params);

    const enrichedResponses = responses.map((response) => ({
      id: response.id,
      submittedAt: response.submitted_at,
      completionTime: response.completion_time,
      answers: JSON.parse(response.answers),
    }));

    return { responses: enrichedResponses, total };
  }

  async createSurveyResponse(response: any) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO survey_responses (id, survey_id, audience_member_id, answers, completion_time, ip_address, respondent_info)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      response.surveyId,
      response.audienceMemberId || null, // Allow null for public responses
      JSON.stringify(response.answers),
      response.completionTime,
      response.ipAddress,
      JSON.stringify(response.respondentInfo || {}),
    );

    return { id, submittedAt: new Date().toISOString() };
  }

  async getSurveyResults(surveyId: string) {
    const survey = await this.getSurvey(surveyId);
    if (!survey) throw new Error("Survey not found");

    const responses = db
      .prepare("SELECT * FROM survey_responses WHERE survey_id = ?")
      .all(surveyId);
    const totalResponses = responses.length;

    // Calculate stats
    const avgTime =
      responses.length > 0
        ? responses.reduce((sum, r) => sum + (r.completion_time || 0), 0) /
        responses.length
        : 0;

    // Process question results
    const questionResults = survey.questions.map((question) => {
      const questionData = {
        questionId: question.id,
        question: question.question,
        type: question.type,
        responses: totalResponses,
        data: [],
      };

      if (question.type === "single_choice" && question.options) {
        const optionCounts = {};
        question.options.forEach((option) => (optionCounts[option] = 0));

        responses.forEach((response) => {
          const answers = JSON.parse(response.answers);
          const answer = answers.find((a) => a.questionId === question.id);
          if (answer && optionCounts.hasOwnProperty(answer.answer)) {
            optionCounts[answer.answer]++;
          }
        });

        questionData.data = Object.entries(optionCounts).map(
          ([option, count]) => ({
            option,
            count: count as number,
            percentage:
              totalResponses > 0
                ? Math.round(((count as number) / totalResponses) * 100)
                : 0,
          }),
        );
      }

      return questionData;
    });

    // Mock demographics and timeline data
    const demographics = {
      age: [
        { ageGroup: "18-24", count: Math.floor(totalResponses * 0.15) },
        { ageGroup: "25-34", count: Math.floor(totalResponses * 0.4) },
        { ageGroup: "35-44", count: Math.floor(totalResponses * 0.3) },
        { ageGroup: "45+", count: Math.floor(totalResponses * 0.15) },
      ],
      gender: [
        { gender: "Male", count: Math.floor(totalResponses * 0.6) },
        { gender: "Female", count: Math.floor(totalResponses * 0.35) },
        { gender: "Other", count: Math.floor(totalResponses * 0.05) },
      ],
      location: [
        { location: "United States", count: Math.floor(totalResponses * 0.5) },
        { location: "Canada", count: Math.floor(totalResponses * 0.2) },
        { location: "Other", count: Math.floor(totalResponses * 0.3) },
      ],
    };

    const responseTimeline = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(
        Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      responses: Math.floor(Math.random() * (totalResponses / 3)),
    }));

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        category: survey.category,
        createdAt: survey.createdAt,
      },
      stats: {
        totalResponses,
        completionRate: survey.completionRate,
        avgTime: Math.round(avgTime * 10) / 10,
        npsScore: Math.floor(Math.random() * 100),
      },
      questionResults,
      demographics,
      responseTimeline,
    };
  }

  // Audience methods
  async getAudienceMembers(filters: any) {
    let query = "SELECT * FROM audience_members WHERE 1=1";
    const params: any[] = [];

    if (filters.search) {
      query += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`,
      );
    }

    if (filters.ageGroup) {
      query += " AND age_group = ?";
      params.push(filters.ageGroup);
    }

    if (filters.gender) {
      query += " AND gender = ?";
      params.push(filters.gender);
    }

    if (filters.country) {
      query += " AND country = ?";
      params.push(filters.country);
    }

    if (filters.industry) {
      query += " AND industry = ?";
      params.push(filters.industry);
    }

    // Count total
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as count");
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult.count;

    // Add pagination
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(filters.limit, (filters.page - 1) * filters.limit);

    const members = db.prepare(query).all(...params);

    const enrichedMembers = members.map((member) => ({
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      ageGroup: member.age_group,
      gender: member.gender,
      city: member.city,
      state: member.state,
      country: member.country,
      industry: member.industry,
      jobTitle: member.job_title,
      education: member.education,
      income: member.income,
      joinedDate: member.joined_date,
      isActive: member.is_active,
      lastActivity: member.last_activity,
      tags: member.tags ? JSON.parse(member.tags) : [],
    }));

    return { members: enrichedMembers, total };
  }

  async getAudienceMember(id: string) {
    const stmt = db.prepare("SELECT * FROM audience_members WHERE id = ?");
    const member = stmt.get(id);

    if (!member) return undefined;

    return {
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      ageGroup: member.age_group,
      gender: member.gender,
      city: member.city,
      state: member.state,
      country: member.country,
      industry: member.industry,
      jobTitle: member.job_title,
      education: member.education,
      income: member.income,
      joinedDate: member.joined_date,
      isActive: member.is_active,
      lastActivity: member.last_activity,
      tags: member.tags ? JSON.parse(member.tags) : [],
    };
  }

  async createAudienceMember(member: any) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO audience_members 
      (id, user_id, first_name, last_name, email, phone, age_group, gender, city, state, country, industry, job_title, education, income, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      member.userId || process.env.USER_ID || uuidv4(), // Default user for now,
      member.firstName,
      member.lastName,
      member.email,
      member.phone,
      member.ageGroup,
      member.gender,
      member.city,
      member.state,
      member.country,
      member.industry,
      member.jobTitle,
      member.education,
      member.income,
      JSON.stringify(member.tags || []),
    );

    return this.getAudienceMember(id);
  }

  async createAudienceMembers(members: any[]) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of members) {
      try {
        // Check if email already exists
        const existing = db
          .prepare("SELECT id FROM audience_members WHERE email = ?")
          .get(member.email);
        if (existing) {
          skipped++;
          continue;
        }

        await this.createAudienceMember(member);
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${member.email}: ${error.message}`);
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }

  async getAudienceStats() {
    const totalResult = db
      .prepare("SELECT COUNT(*) as count FROM audience_members")
      .get();
    const activeResult = db
      .prepare(
        "SELECT COUNT(*) as count FROM audience_members WHERE is_active = 1",
      )
      .get();

    // Get stats by category
    const ageStats = db
      .prepare(
        `
      SELECT age_group, COUNT(*) as count 
      FROM audience_members 
      WHERE age_group IS NOT NULL 
      GROUP BY age_group
    `,
      )
      .all();

    const genderStats = db
      .prepare(
        `
      SELECT gender, COUNT(*) as count 
      FROM audience_members 
      WHERE gender IS NOT NULL 
      GROUP BY gender
    `,
      )
      .all();

    const countryStats = db
      .prepare(
        `
      SELECT country, COUNT(*) as count 
      FROM audience_members 
      WHERE country IS NOT NULL 
      GROUP BY country
      ORDER BY count DESC
      LIMIT 5
    `,
      )
      .all();

    const industryStats = db
      .prepare(
        `
      SELECT industry, COUNT(*) as count 
      FROM audience_members 
      WHERE industry IS NOT NULL 
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 5
    `,
      )
      .all();

    return {
      total: totalResult.count,
      active: activeResult.count,
      byAgeGroup: Object.fromEntries(
        ageStats.map((stat) => [stat.age_group, stat.count]),
      ),
      byGender: Object.fromEntries(
        genderStats.map((stat) => [stat.gender, stat.count]),
      ),
      byCountry: Object.fromEntries(
        countryStats.map((stat) => [stat.country, stat.count]),
      ),
      byIndustry: Object.fromEntries(
        industryStats.map((stat) => [stat.industry, stat.count]),
      ),
    };
  }

  // Audience segment methods
  async getAudienceSegments() {
    const segments = db
      .prepare("SELECT * FROM audience_segments ORDER BY created_at DESC")
      .all();

    return segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      memberCount: segment.member_count,
      createdAt: segment.created_at,
    }));
  }

  async createAudienceSegment(segment: any) {
    const id = uuidv4();

    // Calculate member count based on criteria
    let query = "SELECT COUNT(*) as count FROM audience_members WHERE 1=1";
    const params: any[] = [];

    if (segment.criteria.ageGroups && segment.criteria.ageGroups.length > 0) {
      query +=
        " AND age_group IN (" +
        segment.criteria.ageGroups.map(() => "?").join(",") +
        ")";
      params.push(...segment.criteria.ageGroups);
    }

    if (segment.criteria.genders && segment.criteria.genders.length > 0) {
      query +=
        " AND gender IN (" +
        segment.criteria.genders.map(() => "?").join(",") +
        ")";
      params.push(...segment.criteria.genders);
    }

    if (segment.criteria.countries && segment.criteria.countries.length > 0) {
      query +=
        " AND country IN (" +
        segment.criteria.countries.map(() => "?").join(",") +
        ")";
      params.push(...segment.criteria.countries);
    }

    if (segment.criteria.industries && segment.criteria.industries.length > 0) {
      query +=
        " AND industry IN (" +
        segment.criteria.industries.map(() => "?").join(",") +
        ")";
      params.push(...segment.criteria.industries);
    }

    const countResult = db.prepare(query).get(...params);
    const memberCount = countResult.count;

    const stmt = db.prepare(`
      INSERT INTO audience_segments (id, user_id, name, description, criteria, member_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      segment.userId || process.env.USER_ID || uuidv4(), // Default user for now,
      segment.name,
      segment.description,
      JSON.stringify(segment.criteria),
      memberCount,
    );

    return {
      id,
      name: segment.name,
      memberCount,
    };
  }

  // Dashboard methods
  async getDashboardStats() {
    const totalSurveys = db
      .prepare("SELECT COUNT(*) as count FROM surveys")
      .get().count;
    const totalResponses = db
      .prepare("SELECT COUNT(*) as count FROM survey_responses")
      .get().count;

    // Calculate completion rate
    const surveysWithTargets = db
      .prepare("SELECT target_count FROM surveys WHERE target_count > 0")
      .all();
    const totalTargets = surveysWithTargets.reduce(
      (sum, s) => sum + s.target_count,
      0,
    );
    const completionRate =
      totalTargets > 0 ? Math.round((totalResponses / totalTargets) * 100) : 0;

    // Calculate average response time
    const responseTimes = db
      .prepare(
        "SELECT completion_time FROM survey_responses WHERE completion_time IS NOT NULL",
      )
      .all();
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, r) => sum + r.completion_time, 0) /
        responseTimes.length /
        60 // convert to minutes
        : 0;

    return {
      totalSurveys,
      surveyGrowth: 12, // Mock growth percentage
      totalResponses,
      responseGrowth: 8,
      completionRate,
      completionRateGrowth: 3,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      responseTimeImprovement: 12,
    };
  }

  async getDashboardCharts() {
    // Get survey data by category for bar chart
    const categoryData = db
      .prepare(
        `
      SELECT category, COUNT(*) as survey_count,
      (SELECT COUNT(*) FROM survey_responses sr JOIN surveys s2 ON sr.survey_id = s2.id WHERE s2.category = surveys.category) as response_count
      FROM surveys 
      GROUP BY category
      ORDER BY response_count DESC
      LIMIT 5
    `,
      )
      .all();

    const barChart = categoryData.map((item) => ({
      category: item.category,
      responses: item.response_count,
    }));

    // Mock line chart data (monthly data)
    const lineChart = [
      { month: "Jan", surveys: 10, responses: 320 },
      { month: "Feb", surveys: 12, responses: 380 },
      { month: "Mar", surveys: 15, responses: 450 },
      { month: "Apr", surveys: 18, responses: 520 },
      { month: "May", surveys: 22, responses: 600 },
      { month: "Jun", surveys: 24, responses: 680 },
    ];

    // Pie chart data (same as bar chart but formatted differently)
    const totalResponses = barChart.reduce(
      (sum, item) => sum + item.responses,
      0,
    );
    const pieChart = barChart.map((item) => ({
      category: item.category,
      value:
        totalResponses > 0
          ? Math.round((item.responses / totalResponses) * 100)
          : 0,
    }));

    return { barChart, lineChart, pieChart };
  }

  async getRecentSurveys() {
    const surveys = db
      .prepare(
        `
      SELECT * FROM surveys 
      ORDER BY created_at DESC 
      LIMIT 5
    `,
      )
      .all();

    return surveys.map((survey: any) => {
      const responseCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ?",
        )
        .get(survey.id) as any;
      const completionRate =
        survey.target_count > 0
          ? Math.round((responseCount.count / survey.target_count) * 100)
          : 0;

      return {
        id: survey.id,
        title: survey.title,
        category: survey.category,
        responses: responseCount.count,
        target: survey.target_count,
        completionRate,
        createdAt: this.formatDate(survey.created_at),
        status: survey.status,
      };
    });
  }

  // Categories (implemented at bottom to avoid duplication)
  // Email campaign methods
  async getEmailCampaigns(surveyId?: string) {
    let query = "SELECT * FROM email_campaigns";
    const params = [];

    if (surveyId) {
      query += " WHERE survey_id = ?";
      params.push(surveyId);
    }

    query += " ORDER BY created_at DESC";
    return db.prepare(query).all(...params);
  }

  async getEmailCampaign(campaignId: string) {
    return db
      .prepare("SELECT * FROM email_campaigns WHERE id = ?")
      .get(campaignId);
  }

  async getCampaignAnalytics(campaignId: string) {
    const campaign = await this.getEmailCampaign(campaignId);
    if (!campaign) return null;

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
      sent: recipients.filter((r) =>
        ["sent", "opened", "responded"].includes(r.status),
      ).length,
      failed: recipients.filter((r) => r.status === "failed").length,
      opened: recipients.filter((r) =>
        ["opened", "responded"].includes(r.status),
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

  // Email tracking methods
  async trackEmailOpen(
    trackingId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const currentTime = new Date().toISOString();

    // Update recipient record
    const updateRecipient = db.prepare(`
      UPDATE email_recipients 
      SET status = 'opened', opened_at = ?
      WHERE tracking_id = ? AND status = 'sent'
    `);

    const changes = updateRecipient.run(currentTime, trackingId);

    if (changes.changes > 0) {
      // Get recipient info
      const recipient = db
        .prepare("SELECT * FROM email_recipients WHERE tracking_id = ?")
        .get(trackingId);

      if (recipient) {
        // Create tracking record
        const trackingRecord = db.prepare(`
          INSERT INTO survey_tracking (id, survey_id, recipient_id, tracking_id, ip_address, user_agent, opened_at)
          VALUES (?, (SELECT survey_id FROM email_campaigns WHERE id = ?), ?, ?, ?, ?, ?)
        `);

        trackingRecord.run(
          uuidv4(),
          recipient.campaign_id,
          recipient.id,
          trackingId,
          ipAddress,
          userAgent,
          currentTime,
        );

        // Update campaign opened count
        db.prepare(
          `
          UPDATE email_campaigns 
          SET opened_count = opened_count + 1 
          WHERE id = ?
        `,
        ).run(recipient.campaign_id);
      }
    }
  }

  async trackSurveyAccess(
    surveyId: string,
    trackingId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const currentTime = new Date().toISOString();

    // Create tracking record for survey access
    const trackingRecord = db.prepare(`
      INSERT INTO survey_tracking (id, survey_id, recipient_id, tracking_id, ip_address, user_agent, opened_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let recipientId = null;

    if (trackingId) {
      // Find recipient by tracking ID
      const recipient = db
        .prepare("SELECT id FROM email_recipients WHERE tracking_id = ?")
        .get(trackingId);
      recipientId = recipient?.id;

      // Update recipient status if not already opened
      db.prepare(
        `
        UPDATE email_recipients 
        SET status = 'opened', opened_at = ?
        WHERE tracking_id = ? AND status = 'sent'
      `,
      ).run(currentTime, trackingId);
    }

    trackingRecord.run(
      uuidv4(),
      surveyId,
      recipientId,
      trackingId || uuidv4(),
      ipAddress,
      userAgent,
      currentTime,
    );
  }

  async getCategories() {
    return ["IT Sector", "Healthcare", "Education", "Retail", "Finance"];
  }
}

export const storage = new DatabaseStorage();
