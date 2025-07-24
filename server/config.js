// Survey Platform Configuration
const config = {
  // Question generation settings
  questionGeneration: {
    // Set to 'openai' for AI-generated questions or 'static' for predefined questions
    mode: 'openai', // Options: 'openai' | 'static'
    
    // OpenAI settings (when mode is 'openai')
    openai: {
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      maxQuestions: 10,
      temperature: 0.7,
      questionTypes: ['multiple_choice', 'text', 'rating', 'yes_no']
    },
    
    // Static question settings (when mode is 'static')
    static: {
      defaultQuestionsPerCategory: 5
    }
  },
  
  // Database settings
  database: {
    type: 'sqlite',
    path: 'database.sqlite'
  },
  
  // Server settings
  server: {
    port: 5000,
    cors: {
      enabled: true,
      origin: '*'
    }
  },
  
  // Email settings
  email: {
    enabled: true,
    service: 'nodemailer'
  }
};

export default config;