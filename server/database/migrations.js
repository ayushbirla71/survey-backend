import { v4 as uuidv4 } from "uuid";
import db from "./database.js";

// Sample data generator for development
const generateSampleData = () => {
  // Sample user
  const userId = uuidv4();
  console.log("user id", userId);
  // Insert sample user
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run(
    userId,
    "admin@survey.com",
    "hashed_password",
    "Admin",
    "User"
  );

  // Generate sample audience members
  const insertAudienceMember = db.prepare(`
    INSERT OR IGNORE INTO audience_members 
    (id, user_id, first_name, last_name, email, phone, age_group, gender, city, state, country, industry, job_title, education, income, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleAudience = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      phone: "+1-555-123-4567",
      ageGroup: "25-34",
      gender: "Male",
      city: "New York",
      state: "NY",
      country: "United States",
      industry: "IT Sector",
      jobTitle: "Software Engineer",
      education: "Bachelor's",
      income: "$75k-$100k",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@email.com",
      phone: "+1-555-234-5678",
      ageGroup: "35-44",
      gender: "Female",
      city: "San Francisco",
      state: "CA",
      country: "United States",
      industry: "Healthcare",
      jobTitle: "Doctor",
      education: "Master's",
      income: "$100k-$150k",
    },
  ];

  sampleAudience.forEach((member) => {
    const memberId = uuidv4();
    insertAudienceMember.run(
      memberId,
      userId,
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
      JSON.stringify([member.industry, member.ageGroup, member.gender])
    );
  });

  // Generate sample survey
  const surveyId = uuidv4();
  const insertSurvey = db.prepare(`
    INSERT OR IGNORE INTO surveys 
    (id, user_id, title, description, category, status, questions, audience_criteria, target_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleQuestions = [
    {
      id: "q1",
      type: "multiple_choice",
      question: "How satisfied are you with your current role?",
      options: [
        "Very Satisfied",
        "Satisfied",
        "Neutral",
        "Dissatisfied",
        "Very Dissatisfied",
      ],
      required: true,
    },
  ];

  const audienceCriteria = {
    ageGroups: ["25-34", "35-44"],
    genders: ["Male", "Female"],
    locations: ["United States"],
    industries: ["IT Sector"],
    targetCount: 500,
    dataSource: "default",
  };

  insertSurvey.run(
    surveyId,
    userId,
    "IT Professional Work Satisfaction",
    "Understanding job satisfaction levels among IT professionals",
    "IT Sector",
    "active",
    JSON.stringify(sampleQuestions),
    JSON.stringify(audienceCriteria),
    500
  );

  console.log("Sample data generated successfully");
};

export { generateSampleData };
