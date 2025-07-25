import OpenAI from "openai";
import config from "../config.js";

import dotenv from "dotenv";
dotenv.config();

// Initialize OpenAI client conditionally
let openai = null;

console.log(
  "open ai key",
  process.env.OPENAI_API_KEY ? "provided" : "not provided",
);

if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn("Failed to initialize OpenAI client:", error.message);
  }
}

// Static question templates by category
const staticQuestions = {
  "IT Sector": [
    {
      type: "single_choice",
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
    {
      type: "single_choice",
      question: "What is your primary programming language?",
      options: ["JavaScript", "Python", "Java", "C#", "PHP", "Other"],
      required: false,
    },
    {
      type: "rating",
      question: "Rate your work-life balance (1-5)",
      options: ["1", "2", "3", "4", "5"],
      required: true,
    },
    {
      type: "text",
      question: "What technologies would you like to learn next?",
      options: [],
      required: false,
    },
    {
      type: "yes_no",
      question: "Would you recommend your company to others?",
      options: ["Yes", "No"],
      required: true,
    },
  ],

  Healthcare: [
    {
      type: "single_choice",
      question: "How would you rate the quality of healthcare services?",
      options: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      required: true,
    },
    {
      type: "single_choice",
      question: "What is your primary concern about healthcare?",
      options: ["Cost", "Access", "Quality", "Wait Times", "Communication"],
      required: true,
    },
    {
      type: "rating",
      question:
        "Rate your overall satisfaction with healthcare providers (1-5)",
      options: ["1", "2", "3", "4", "5"],
      required: true,
    },
    {
      type: "text",
      question: "What improvements would you suggest for healthcare services?",
      options: [],
      required: false,
    },
    {
      type: "yes_no",
      question: "Do you have health insurance?",
      options: ["Yes", "No"],
      required: true,
    },
  ],

  Education: [
    {
      type: "single_choice",
      question: "How would you rate the quality of education?",
      options: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      required: true,
    },
    {
      type: "single_choice",
      question: "What is most important in education?",
      options: [
        "Practical Skills",
        "Theoretical Knowledge",
        "Critical Thinking",
        "Creativity",
        "Communication",
      ],
      required: true,
    },
    {
      type: "rating",
      question: "Rate the effectiveness of online learning (1-5)",
      options: ["1", "2", "3", "4", "5"],
      required: true,
    },
    {
      type: "text",
      question: "What subjects should be given more emphasis?",
      options: [],
      required: false,
    },
    {
      type: "yes_no",
      question: "Should technology play a bigger role in education?",
      options: ["Yes", "No"],
      required: true,
    },
  ],

  Retail: [
    {
      type: "rating",
      question:
        "How appealing do you find this new product based on the description/images you saw?",
      options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      required: true,
    },
    {
      type: "checkbox",
      question: "What features stood out to you the most?",
      options: [
        "Design/appearance",
        "Pricing",
        "Functionality",
        "Brand reputation",
        "Sustainability",
        "None of these",
      ],
      required: true,
    },
    {
      type: "text",
      question: "What would make you more likely to try or buy this product?",
      options: [],
      required: false,
    },
    {
      type: "rating",
      question:
        "How likely are you to recommend this product to a friend or colleague?",
      options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      required: true,
    },
  ],

  Finance: [
    {
      type: "single_choice",
      question: "Overall, how satisfied are you with your experience with us?",
      options: [
        "Very satisfied",
        "Somewhat satisfied",
        "Neutral",
        "Somewhat dissatisfied",
        "Very dissatisfied",
      ],
      required: true,
    },
    {
      type: "rating",
      question: "How likely are you to recommend us to a friend or colleague?",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      required: true,
    },
    {
      type: "text",
      question: "What is one thing we could do to improve your experience?",
      options: [],
      required: true,
    },
  ],
};

// Generate questions using OpenAI
async function generateQuestionsWithAI(
  category,
  description,
  questionCount = 3,
) {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized - API key missing");
    }
    const prompt = `Generate ${questionCount} survey questions for the "${category}" category.
    
Additional context: ${description || "No additional context provided"}

Requirements:
- Create diverse question types: single_choice, text, rating, yes_no
- For single_choice questions, provide 3-5 relevant options
- For rating questions, use 1-5 scale with options ['1', '2', '3', '4', '5']
- For yes_no questions, use options ['Yes', 'No']
- For text questions, use empty options array []
- Make questions relevant to the category and context
- Mix required (true) and optional (false) questions
- Ensure questions are professional and unbiased

Respond with a JSON array of question objects in this exact format:
[
  {
    "type": "single_choice",
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3"],
    "required": true
  }
]`;

    const response = await openai.chat.completions.create({
      model: config.questionGeneration.openai.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert survey designer. Generate professional, unbiased survey questions in valid JSON format only. Do not include any explanatory text outside the JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.questionGeneration.openai.temperature,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    // Try to parse the JSON response
    let questions;
    try {
      // The response might be wrapped in a JSON object with a questions array
      const parsed = JSON.parse(content);
      questions = parsed.questions || parsed;
    } catch (parseError) {
      // If parsing fails, try to extract JSON array from the content
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse OpenAI response");
      }
    }

    // Validate and format questions
    const formattedQuestions = questions.map((q, index) => ({
      id: `ai_q${index + 1}`,
      type: q.type || "text",
      question: q.question || "Generated question",
      options: Array.isArray(q.options) ? q.options : [],
      required: typeof q.required === "boolean" ? q.required : true,
    }));

    return formattedQuestions;
  } catch (error) {
    console.error("Error generating questions with AI:", error);

    // Fallback to static questions if AI generation fails
    console.log("Falling back to static questions for category:", category);
    return getStaticQuestions(category);
  }
}

// Get static questions for a category
function getStaticQuestions(category) {
  const questions = staticQuestions[category] || staticQuestions["IT Sector"];

  return questions.map((q, index) => ({
    id: `static_q${index + 1}`,
    ...q,
  }));
}

// Main function to generate questions based on configuration
async function generateQuestions(
  category,
  description = "",
  questionCount = 5,
) {
  const mode = config.questionGeneration.mode;

  if (mode === "openai" && openai) {
    console.log(`Generating questions with AI for category: ${category}`);
    return await generateQuestionsWithAI(category, description, questionCount);
  } else {
    console.log(`Using static questions for category: ${category}`);
    return getStaticQuestions(category);
  }
}

// Get available categories
function getAvailableCategories() {
  return Object.keys(staticQuestions);
}

// Test OpenAI connection
async function testOpenAIConnection() {
  try {
    if (!openai) {
      return {
        connected: false,
        error: "OpenAI client not initialized - API key missing",
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5,
    });

    return { connected: true, model: response.model };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

export {
  generateQuestions,
  getStaticQuestions,
  generateQuestionsWithAI,
  getAvailableCategories,
  testOpenAIConnection,
  staticQuestions,
};
