# Survey Platform Frontend API Documentation

## Base URL
```
http://localhost:5000
```

## Response Format
All API responses follow this standardized format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [<array_of_items>],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Public Survey APIs (No Authentication Required)

These endpoints are designed for HTML survey forms and public access.

### 1. Get Survey for Public Form

**GET** `/api/public/survey/:id`

Retrieves survey data needed to render a public survey form.

**Parameters:**
- `id` (string, required): Survey ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e2eb2098-e323-4f5b-85c1-76e39bca91e9",
    "title": "IT Professional Work Satisfaction",
    "description": "Understanding job satisfaction levels among IT professionals",
    "category": "IT Sector",
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "How satisfied are you with your current role?",
        "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
        "required": true
      }
    ],
    "status": "active"
  }
}
```

**Example Usage:**
```javascript
// Fetch survey data for form
fetch('/api/public/survey/SURVEY_ID')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Render survey form with data.data
      renderSurveyForm(data.data);
    }
  });
```

### 2. Submit Survey Response

**POST** `/api/public/survey/:id/submit`

Submits completed survey responses from HTML forms.

**Parameters:**
- `id` (string, required): Survey ID

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "question": "How satisfied are you with your current role?",
      "answer": "Satisfied"
    }
  ],
  "completionTime": 45,
  "respondentInfo": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "05546ed0-54e8-4472-b326-1d0eb741fb94",
    "message": "Survey response submitted successfully",
    "submittedAt": "2025-07-23T10:51:28.015Z"
  }
}
```

**Example Usage:**
```javascript
// Submit survey response
const submitSurvey = async (surveyId, answers, completionTime, respondentInfo) => {
  const response = await fetch(`/api/public/survey/${surveyId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      answers,
      completionTime,
      respondentInfo
    })
  });
  
  const result = await response.json();
  return result;
};
```

### 3. Get Thank You Message

**GET** `/api/public/survey/:id/thank-you`

Retrieves thank you message and survey info for completion page.

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "IT Professional Work Satisfaction",
    "message": "Thank you for completing the survey!",
    "category": "IT Sector"
  }
}
```

---

## Dashboard APIs

### 1. Get Dashboard Statistics

**GET** `/api/dashboard/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSurveys": 24,
    "surveyGrowth": 12,
    "totalResponses": 1842,
    "responseGrowth": 8,
    "completionRate": 76,
    "completionRateGrowth": 3,
    "avgResponseTime": 4.2,
    "responseTimeImprovement": 12
  }
}
```

### 2. Get Dashboard Charts

**GET** `/api/dashboard/charts`

**Response:**
```json
{
  "success": true,
  "data": {
    "barChart": [
      { "category": "IT Sector", "responses": 320 },
      { "category": "Automotive", "responses": 240 }
    ],
    "lineChart": [
      { "month": "Jan", "surveys": 10, "responses": 320 },
      { "month": "Feb", "surveys": 12, "responses": 380 }
    ],
    "pieChart": [
      { "category": "IT Sector", "value": 32 },
      { "category": "Automotive", "value": 24 }
    ]
  }
}
```

### 3. Get Recent Surveys

**GET** `/api/dashboard/recent-surveys`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "survey-1",
      "title": "IT Professional Work Satisfaction",
      "category": "IT Sector",
      "responses": 320,
      "target": 500,
      "completionRate": 76,
      "createdAt": "2023-06-15",
      "status": "active"
    }
  ]
}
```

---

## Survey Management APIs

### 1. Get All Surveys

**GET** `/api/surveys`

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page
- `search` (string, optional): Search term
- `status` (string, optional): Filter by status (active|completed|draft)
- `category` (string, optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "survey-1",
      "title": "IT Professional Work Satisfaction",
      "category": "IT Sector",
      "status": "active",
      "responses": 320,
      "target": 500,
      "completionRate": 76,
      "createdAt": "2023-06-15",
      "updatedAt": "2023-06-20"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3
  }
}
```

### 2. Get Single Survey

**GET** `/api/surveys/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "survey-1",
    "title": "IT Professional Work Satisfaction",
    "description": "Understanding job satisfaction levels among IT professionals",
    "category": "IT Sector",
    "status": "active",
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "How satisfied are you with our product?",
        "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
        "required": true
      }
    ],
    "audience": {
      "ageGroups": ["25-34", "35-44"],
      "genders": ["Male", "Female"],
      "locations": ["United States"],
      "industries": ["IT Sector"],
      "targetCount": 500,
      "dataSource": "default"
    },
    "responses": 320,
    "target": 500,
    "completionRate": 76,
    "createdAt": "2023-06-15",
    "updatedAt": "2023-06-20"
  }
}
```

### 3. Create New Survey

**POST** `/api/surveys`

**Request Body:**
```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Understanding customer satisfaction with our product",
  "category": "IT Sector",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "How satisfied are you with our product?",
      "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      "required": true
    }
  ],
  "audience": {
    "ageGroups": ["25-34", "35-44"],
    "genders": ["Male", "Female"],
    "locations": ["United States"],
    "industries": ["IT Sector"],
    "targetCount": 500,
    "dataSource": "default"
  }
}
```

### 4. Update Survey

**PUT** `/api/surveys/:id`

**Request Body:**
```json
{
  "title": "Updated Survey Title",
  "description": "Updated description",
  "status": "active",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Updated question?",
      "options": ["Option 1", "Option 2"],
      "required": true
    }
  ]
}
```

### 5. Delete Survey

**DELETE** `/api/surveys/:id`

### 6. Duplicate Survey

**POST** `/api/surveys/:id/duplicate`

### 7. Send Survey to Audience

**POST** `/api/surveys/:id/send`

**Response:**
```json
{
  "success": true,
  "data": {
    "sentCount": 500,
    "message": "Survey sent successfully to 500 recipients"
  }
}
```

---

## Survey Results APIs

### 1. Get Survey Results

**GET** `/api/surveys/:id/results`

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "survey-1",
      "title": "IT Professional Work Satisfaction",
      "description": "Understanding job satisfaction levels among IT professionals",
      "category": "IT Sector",
      "createdAt": "2023-06-15"
    },
    "stats": {
      "totalResponses": 320,
      "completionRate": 76,
      "avgTime": 4.2,
      "npsScore": 42
    },
    "questionResults": [
      {
        "questionId": "q1",
        "question": "How satisfied are you with your current role?",
        "type": "multiple_choice",
        "responses": 320,
        "data": [
          { "option": "Very Satisfied", "count": 96, "percentage": 30 },
          { "option": "Satisfied", "count": 128, "percentage": 40 }
        ]
      }
    ],
    "demographics": {
      "age": [
        { "ageGroup": "18-24", "count": 48 },
        { "ageGroup": "25-34", "count": 128 }
      ],
      "gender": [
        { "gender": "Male", "count": 192 },
        { "gender": "Female", "count": 112 }
      ],
      "location": [
        { "location": "United States", "count": 160 },
        { "location": "Canada", "count": 64 }
      ]
    },
    "responseTimeline": [
      { "date": "Jun 15", "responses": 45 },
      { "date": "Jun 16", "responses": 62 }
    ]
  }
}
```

### 2. Get Individual Survey Responses

**GET** `/api/surveys/:id/responses`

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page

### 3. Export Survey Data

**GET** `/api/surveys/:id/export`

**Query Parameters:**
- `format` (string): Export format (csv|excel|pdf|json)

**Response:** Binary file download

---

## Audience Management APIs

### 1. Get Audience Members

**GET** `/api/audience`

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 50): Items per page
- `search` (string, optional): Search term
- `ageGroup` (string, optional): Filter by age group
- `gender` (string, optional): Filter by gender
- `country` (string, optional): Filter by country
- `industry` (string, optional): Filter by industry

### 2. Get Audience Statistics

**GET** `/api/audience/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10000,
    "active": 9000,
    "byAgeGroup": {
      "18-24": 1500,
      "25-34": 3000,
      "35-44": 2500,
      "45-54": 2000,
      "55-64": 800,
      "65+": 200
    },
    "byGender": {
      "Male": 5200,
      "Female": 4500,
      "Non-binary": 200,
      "Prefer not to say": 100
    },
    "byCountry": {
      "United States": 6000,
      "Canada": 1500,
      "United Kingdom": 1200,
      "Germany": 800,
      "Australia": 500
    },
    "byIndustry": {
      "IT Sector": 2000,
      "Healthcare": 1500,
      "Finance": 1200,
      "Education": 1000,
      "Retail": 800
    }
  }
}
```

### 3. Import Audience Data

**POST** `/api/audience/import`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV or Excel file

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 1500,
    "skipped": 50,
    "errors": [
      "Row 25: Invalid email format",
      "Row 67: Missing required field 'firstName'"
    ]
  }
}
```

### 4. Export Audience Data

**GET** `/api/audience/export`

**Query Parameters:**
- `format` (string, default: csv): Export format (csv|excel)
- `ageGroup` (string, optional): Filter by age group
- `gender` (string, optional): Filter by gender
- `country` (string, optional): Filter by country
- `industry` (string, optional): Filter by industry

### 5. Create Audience Segment

**POST** `/api/audience/segments`

**Request Body:**
```json
{
  "name": "IT Professionals (25-44)",
  "description": "Age 25-44, IT Sector, Active users",
  "criteria": {
    "ageGroups": ["25-34", "35-44"],
    "genders": ["Male", "Female"],
    "countries": ["United States"],
    "industries": ["IT Sector"]
  }
}
```

### 6. Get Audience Segments

**GET** `/api/audience/segments`

---

## Question Generation APIs (NEW)

The survey platform now includes dynamic question generation with OpenAI integration. Questions can be generated either using AI (when configured) or static templates based on categories.

### 1. Generate Questions Dynamically

**POST** `/api/questions/generate`

Generates survey questions using either OpenAI AI or static templates based on configuration.

**Request Body:**
```json
{
  "category": "IT Sector",
  "description": "Survey about remote work satisfaction and productivity in tech companies",
  "questionCount": 5
}
```

**Parameters:**
- `category` (string, required): Category for the survey
- `description` (string, optional): Additional context for AI generation
- `questionCount` (number, optional, default: 5): Number of questions to generate

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "IT Sector",
    "description": "Survey about remote work satisfaction and productivity in tech companies",
    "questionCount": 5,
    "questions": [
      {
        "id": "ai_q1",
        "type": "multiple_choice",
        "question": "How satisfied are you with your current remote work setup?",
        "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
        "required": true
      },
      {
        "id": "ai_q2",
        "type": "rating",
        "question": "Rate your productivity while working remotely (1-5)",
        "options": ["1", "2", "3", "4", "5"],
        "required": true
      },
      {
        "id": "ai_q3",
        "type": "text",
        "question": "What tools or resources would improve your remote work experience?",
        "options": [],
        "required": false
      }
    ],
    "generatedWith": "openai"
  }
}
```

**Question Types:**
- `multiple_choice`: Multiple choice questions with predefined options
- `text`: Open-ended text questions (options array is empty)
- `rating`: Rating scale questions (1-5 scale)
- `yes_no`: Yes/No questions with options ["Yes", "No"]

**Example Usage:**
```javascript
// Generate questions with AI/static fallback
const generateQuestions = async (category, description, count) => {
  const response = await fetch('/api/questions/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      category,
      description,
      questionCount: count
    })
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Generated with:', result.data.generatedWith); // 'openai' or 'static'
    return result.data.questions;
  }
  throw new Error(result.error);
};

// Use in survey creation
const questions = await generateQuestions(
  'Healthcare', 
  'Patient satisfaction survey for hospital services', 
  7
);
```

### 2. Get Available Categories

**GET** `/api/questions/categories`

Retrieves all available categories for question generation.

**Response:**
```json
{
  "success": true,
  "data": [
    "IT Sector",
    "Healthcare", 
    "Education",
    "Retail",
    "Finance"
  ]
}
```

### 3. Get Static Questions by Category

**GET** `/api/questions/static/:category`

Retrieves predefined static questions for a specific category.

**Parameters:**
- `category` (string, required): Category name

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "Healthcare",
    "questions": [
      {
        "id": "static_q1",
        "type": "multiple_choice",
        "question": "How would you rate the quality of healthcare services?",
        "options": ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
        "required": true
      },
      {
        "id": "static_q2",
        "type": "text",
        "question": "What improvements would you suggest for healthcare services?",
        "options": [],
        "required": false
      }
    ],
    "generatedWith": "static"
  }
}
```

### 4. Get Question Generation Configuration

**GET** `/api/questions/config`

Retrieves current configuration and status of the question generation system.

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "openai",
    "openaiConnected": false,
    "openaiError": "429 You exceeded your current quota, please check your plan and billing details.",
    "availableCategories": ["IT Sector", "Healthcare", "Education", "Retail", "Finance"],
    "settings": {
      "openai": {
        "model": "gpt-4o",
        "maxQuestions": 10,
        "temperature": 0.7,
        "questionTypes": ["multiple_choice", "text", "rating", "yes_no"]
      },
      "static": {
        "defaultQuestionsPerCategory": 5
      }
    }
  }
}
```

**Configuration Fields:**
- `mode`: Current generation mode ("openai" or "static")
- `openaiConnected`: Whether OpenAI API is accessible
- `openaiError`: Error message if OpenAI connection failed
- `availableCategories`: List of supported categories
- `settings`: Configuration details for both modes

### Smart Fallback System

The question generation system includes intelligent fallback:

1. **Primary Mode**: When configured for "openai", it attempts AI generation
2. **Automatic Fallback**: If OpenAI fails (quota, network, etc.), automatically falls back to static questions
3. **Graceful Degradation**: Users always receive relevant questions regardless of AI service status
4. **Clear Indication**: Response includes `generatedWith` field showing which method was used

### Integration with Survey Creation

When creating surveys, use the question generation API:

```javascript
// Enhanced survey creation with dynamic questions
const createSurveyWithGeneratedQuestions = async (surveyData) => {
  // Generate questions first
  const questionResponse = await fetch('/api/questions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: surveyData.category,
      description: surveyData.description,
      questionCount: surveyData.desiredQuestionCount || 5
    })
  });
  
  const questionResult = await questionResponse.json();
  if (!questionResult.success) {
    throw new Error('Failed to generate questions');
  }
  
  // Create survey with generated questions
  const surveyResponse = await fetch('/api/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...surveyData,
      questions: questionResult.data.questions
    })
  });
  
  return await surveyResponse.json();
};
```

---

## Utility APIs

### 1. Get Categories

**GET** `/api/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    "IT Sector",
    "Automotive",
    "Healthcare",
    "Education",
    "Retail",
    "Finance",
    "Manufacturing",
    "Entertainment",
    "Food & Beverage",
    "Travel & Tourism",
    "Real Estate",
    "Media",
    "Sports",
    "Technology",
    "Energy"
  ]
}
```

### 2. Health Check

**GET** `/api/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2025-07-23T10:51:28.015Z"
  }
}
```

---

## Error Codes

### Authentication Errors
- `AUTH_001`: Invalid or missing token
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions

### Validation Errors
- `VAL_001`: Missing required field
- `VAL_002`: Invalid field format
- `VAL_003`: Field value out of range

### Resource Errors
- `RES_001`: Resource not found
- `RES_002`: Resource already exists
- `RES_003`: Resource access denied

### Server Errors
- `SRV_001`: Internal server error
- `SRV_002`: Database connection error
- `SRV_003`: External service unavailable

---

## Frontend Integration Examples

### HTML Survey Form Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>Survey Form</title>
</head>
<body>
    <div id="survey-container"></div>
    
    <script>
        // Get survey ID from URL or other source
        const surveyId = 'e2eb2098-e323-4f5b-85c1-76e39bca91e9';
        
        // Load and render survey
        async function loadSurvey() {
            try {
                const response = await fetch(`/api/public/survey/${surveyId}`);
                const result = await response.json();
                
                if (result.success) {
                    renderSurvey(result.data);
                } else {
                    showError('Survey not found');
                }
            } catch (error) {
                showError('Failed to load survey');
            }
        }
        
        // Render survey form
        function renderSurvey(survey) {
            const container = document.getElementById('survey-container');
            let html = `
                <h1>${survey.title}</h1>
                <p>${survey.description}</p>
                <form id="survey-form">
            `;
            
            survey.questions.forEach(question => {
                html += `
                    <div class="question">
                        <h3>${question.question}</h3>
                `;
                
                if (question.type === 'multiple_choice') {
                    question.options.forEach(option => {
                        html += `
                            <label>
                                <input type="radio" name="${question.id}" value="${option}" ${question.required ? 'required' : ''}>
                                ${option}
                            </label>
                        `;
                    });
                }
                
                html += `</div>`;
            });
            
            html += `
                    <button type="submit">Submit Survey</button>
                </form>
            `;
            
            container.innerHTML = html;
            
            // Add form submission handler
            document.getElementById('survey-form').addEventListener('submit', handleSubmit);
        }
        
        // Handle form submission
        async function handleSubmit(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const answers = [];
            
            // Convert form data to answers array
            for (let [questionId, answer] of formData.entries()) {
                answers.push({
                    questionId,
                    question: getQuestionText(questionId),
                    answer
                });
            }
            
            // Submit survey response
            try {
                const response = await fetch(`/api/public/survey/${surveyId}/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        answers,
                        completionTime: Math.floor(Date.now() / 1000), // Simple completion time
                        respondentInfo: {
                            // Add any additional respondent info if needed
                        }
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showThankYou();
                } else {
                    showError('Failed to submit survey');
                }
            } catch (error) {
                showError('Failed to submit survey');
            }
        }
        
        // Show thank you message
        async function showThankYou() {
            try {
                const response = await fetch(`/api/public/survey/${surveyId}/thank-you`);
                const result = await response.json();
                
                const container = document.getElementById('survey-container');
                container.innerHTML = `
                    <h1>${result.data.title}</h1>
                    <p>${result.data.message}</p>
                `;
            } catch (error) {
                document.getElementById('survey-container').innerHTML = `
                    <h1>Thank You!</h1>
                    <p>Your response has been submitted successfully.</p>
                `;
            }
        }
        
        // Helper functions
        function getQuestionText(questionId) {
            // Implementation to get question text by ID
            return 'Question text';
        }
        
        function showError(message) {
            document.getElementById('survey-container').innerHTML = `
                <div class="error">
                    <h2>Error</h2>
                    <p>${message}</p>
                </div>
            `;
        }
        
        // Initialize
        loadSurvey();
    </script>
</body>
</html>
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const SurveyForm = ({ surveyId }) => {
    const [survey, setSurvey] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        loadSurvey();
    }, [surveyId]);

    const loadSurvey = async () => {
        try {
            const response = await fetch(`/api/public/survey/${surveyId}`);
            const result = await response.json();
            
            if (result.success) {
                setSurvey(result.data);
            }
        } catch (error) {
            console.error('Failed to load survey:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            question: survey.questions.find(q => q.id === questionId)?.question || '',
            answer
        }));

        try {
            const response = await fetch(`/api/public/survey/${surveyId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answers: formattedAnswers,
                    completionTime: 60, // Calculate actual completion time
                    respondentInfo: {}
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setSubmitted(true);
            }
        } catch (error) {
            console.error('Failed to submit survey:', error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (submitted) return <div>Thank you for completing the survey!</div>;
    if (!survey) return <div>Survey not found</div>;

    return (
        <div>
            <h1>{survey.title}</h1>
            <p>{survey.description}</p>
            
            <form onSubmit={handleSubmit}>
                {survey.questions.map(question => (
                    <div key={question.id}>
                        <h3>{question.question}</h3>
                        
                        {question.type === 'multiple_choice' && (
                            <div>
                                {question.options.map(option => (
                                    <label key={option}>
                                        <input
                                            type="radio"
                                            name={question.id}
                                            value={option}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            required={question.required}
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                <button type="submit">Submit Survey</button>
            </form>
        </div>
    );
};

export default SurveyForm;
```

---

## Rate Limiting
- 1000 requests per hour per client
- 100 requests per minute per client
- File uploads limited to 10MB

## File Upload Requirements

### Audience Import
- **Supported formats:** CSV, Excel (.xlsx)
- **Maximum file size:** 10MB
- **Required columns:** firstName, lastName, email
- **Optional columns:** phone, ageGroup, gender, city, state, country, industry, jobTitle, education, income