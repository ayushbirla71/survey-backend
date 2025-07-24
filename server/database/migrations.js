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
    "User",
  );

  // Generate sample audience members
  const insertAudienceMember = db.prepare(`
    INSERT OR IGNORE INTO audience_members 
    (id, user_id, first_name, last_name, email, phone, age_group, gender, city, state, country, industry, job_title, education, income, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleAudience = [
    {
      firstName: "Ayush",
      lastName: "Birla",
      email: "Ayushbirla71@gmail.com",
      phone: "+91-9876543210",
      ageGroup: "25-34",
      gender: "Male",
      city: "Indore",
      state: "Madhya Pradesh",
      country: "India",
      industry: "IT Sector",
      jobTitle: "Software Engineer",
      education: "Bachelor's",
      income: "₹6L–₹10L",
    },
    {
      firstName: "Priya",
      lastName: "Mehra",
      email: "priya.mehra@example.com",
      phone: "+91-9812345678",
      ageGroup: "18-24",
      gender: "Female",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      industry: "Education",
      jobTitle: "Student",
      education: "Bachelor's (Pursuing)",
      income: "₹0–₹1L",
    },
    {
      firstName: "Ravi",
      lastName: "Kumar",
      email: "ravi.kumar@xyz.com",
      phone: "+91-9900112233",
      ageGroup: "35-44",
      gender: "Male",
      city: "Patna",
      state: "Bihar",
      country: "India",
      industry: "Government",
      jobTitle: "Bank Manager",
      education: "Master's",
      income: "₹10L–₹15L",
    },
    {
      firstName: "Neha",
      lastName: "Sharma",
      email: "neha.sharma@email.in",
      phone: "+91-8888777766",
      ageGroup: "25-34",
      gender: "Female",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      industry: "Finance",
      jobTitle: "Chartered Accountant",
      education: "CA",
      income: "₹12L–₹18L",
    },
    {
      firstName: "Arjun",
      lastName: "Reddy",
      email: "arjun.reddy@example.in",
      phone: "+91-9988776655",
      ageGroup: "25-34",
      gender: "Male",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      industry: "Healthcare",
      jobTitle: "Dentist",
      education: "BDS",
      income: "₹8L–₹12L",
    },
    {
      firstName: "Simran",
      lastName: "Kaur",
      email: "simran.kaur@sample.com",
      phone: "+91-9123456780",
      ageGroup: "35-44",
      gender: "Female",
      city: "Chandigarh",
      state: "Punjab",
      country: "India",
      industry: "Education",
      jobTitle: "School Principal",
      education: "Ph.D.",
      income: "₹15L–₹20L",
    },
    {
      firstName: "Amit",
      lastName: "Jain",
      email: "amit.jain@techcorp.com",
      phone: "+91-9654321870",
      ageGroup: "25-34",
      gender: "Male",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      industry: "Tech Startup",
      jobTitle: "Product Manager",
      education: "MBA",
      income: "₹18L–₹25L",
    },
    {
      firstName: "Pooja",
      lastName: "Patel",
      email: "pooja.patel@designhub.in",
      phone: "+91-9765432100",
      ageGroup: "18-24",
      gender: "Female",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      industry: "Design",
      jobTitle: "Graphic Designer",
      education: "Bachelor's",
      income: "₹3L–₹6L",
    },
    {
      firstName: "Manish",
      lastName: "Verma",
      email: "manish.verma@sales.com",
      phone: "+91-9345678910",
      ageGroup: "45-54",
      gender: "Male",
      city: "Lucknow",
      state: "Uttar Pradesh",
      country: "India",
      industry: "Retail",
      jobTitle: "Sales Director",
      education: "MBA",
      income: "₹20L–₹30L",
    },
    {
      firstName: "Anjali",
      lastName: "Deshmukh",
      email: "anjali.deshmukh@research.org",
      phone: "+91-9234567810",
      ageGroup: "25-34",
      gender: "Female",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      industry: "Research",
      jobTitle: "Data Analyst",
      education: "Master's",
      income: "₹10L–₹14L",
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
      JSON.stringify([member.industry, member.ageGroup, member.gender]),
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
    500,
  );

  console.log("Sample data generated successfully");
};

export { generateSampleData };
