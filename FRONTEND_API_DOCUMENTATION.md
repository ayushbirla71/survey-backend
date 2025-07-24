# Survey Platform Frontend API Documentation

## HTML Survey APIs

### Create HTML Survey with Auto Email Sending
**POST** `/api/surveys/:id/create-html`

Creates HTML version of survey and automatically sends emails to selected audience.

**Request Body:**
```json
{
  "selectedAudience": [
    {
      "id": "audience-member-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "campaignName": "Q1 2025 Customer Satisfaction Survey",
  "autoSendEmails": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "surveyId": "survey-id",
      "publicUrl": "/survey/survey-id",
      "htmlContent": "<!DOCTYPE html>...",
      "updatedAt": "2025-07-24T08:50:00.000Z"
    },
    "email": {
      "campaignId": "campaign-id",
      "sent": 25,
      "failed": 0,
      "errors": []
    },
    "message": "HTML survey created successfully and sent to 25 recipients"
  }
}
```

### Get Survey HTML (Public Access)
**GET** `/survey/:id`

Returns HTML survey for public access. Tracks survey views when tracking ID is provided.

**Query Parameters:**
- `t` (optional): Tracking ID for email tracking

**Response:** HTML content of the survey

### Download Survey HTML
**GET** `/api/surveys/:id/download-html`

Downloads the HTML survey as a file.

**Response:** HTML file download with appropriate headers

### Get Survey Details with HTML and Email Stats
**GET** `/api/surveys/:id/details`

Returns comprehensive survey information including HTML status and email campaign statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "survey-id",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our services",
    "category": "Customer Feedback",
    "status": "active",
    "questions": [...],
    "audience": {...},
    "responses": 15,
    "target": 100,
    "completionRate": 15,
    "hasHtml": true,
    "publicUrl": "/survey/survey-id",
    "emailStats": {
      "totalSent": 100,
      "totalOpened": 45,
      "openRate": 45,
      "campaignCount": 2
    },
    "campaigns": [
      {
        "id": "campaign-id",
        "name": "Q1 2025 Campaign",
        "sentCount": 50,
        "openedCount": 25,
        "status": "completed",
        "sentAt": "2025-07-24T08:30:00.000Z"
      }
    ]
  }
}
```

## Updated Survey Response Collection

### Submit Survey Response (Public)
**POST** `/api/public/survey/:id/submit`

Submits a survey response from HTML form. Automatically updates survey response count.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "question": "How satisfied are you?",
      "answer": "Very Satisfied"
    }
  ],
  "completionTime": 120,
  "respondentInfo": {
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-07-24T08:50:00.000Z"
  }
}
```

## Usage Workflow

### 1. Create Survey with HTML and Auto-Email
```bash
# Create survey first
POST /api/surveys
{
  "title": "Customer Feedback Survey",
  "description": "Your feedback matters",
  "category": "Customer Service",
  "questions": [...],
  "audience": {...}
}

# Then create HTML and auto-send emails
POST /api/surveys/{survey-id}/create-html
{
  "selectedAudience": [...], // Array of audience members
  "campaignName": "Customer Feedback Campaign",
  "autoSendEmails": true
}
```

### 2. Track Survey Performance
```bash
# Get complete survey details with email stats
GET /api/surveys/{survey-id}/details

# Track email opens via tracking pixel
GET /api/track/open/{tracking-id}

# Public survey access with tracking
GET /survey/{survey-id}?t={tracking-id}
```

### 3. Collect Responses
```bash
# Public form submission
POST /api/public/survey/{survey-id}/submit
{
  "answers": [...],
  "completionTime": 180
}
```

## Email Tracking Integration

All email tracking data is automatically connected to the survey model:

- **emails_sent**: Total emails sent across all campaigns
- **emails_opened**: Total unique email opens
- **response_count**: Total survey responses received

Email tracking pixels are automatically embedded in HTML emails and surveys for comprehensive analytics.

## Development Notes

- In development mode, emails are simulated (not actually sent) but tracking records are created
- HTML surveys include embedded CSS and JavaScript for standalone functionality
- All tracking data flows back to the main survey record for unified analytics
- Public survey URLs include tracking parameters for email attribution

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `RES_001`: Resource not found
- `VAL_001`: Validation error
- `SRV_001`: Server error