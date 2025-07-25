interface Survey {
    id: string;
    title: string;
    description: string;
    category: string;
    questions: Array<{
        id: string;
        type: string;
        question: string;
        options?: string[];
        required: boolean;
    }>;
}

interface HtmlGenerationOptions {
    includeTracking?: boolean;
    trackingId?: string;
    customStyles?: string;
    submitUrl?: string;
}

export class HtmlSurveyService {
    /**
     * Generate HTML content for a survey
     */
    generateSurveyHtml(
        survey: Survey,
        options: HtmlGenerationOptions = {},
    ): string {
        const {
            includeTracking = false,
            trackingId = "",
            customStyles = "",
            submitUrl = `/api/public/survey/${survey.id}/submit`,
        } = options;

        const trackingParams =
            includeTracking && trackingId ? `?t=${trackingId}` : "";
        const trackingPixel =
            includeTracking && trackingId
                ? `<img src="/api/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="">`
                : "";

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(survey.title)} - Survey</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background: #f5f5f5;
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
        }
        .header h1 { 
            font-size: 2.2em; 
            margin-bottom: 10px; 
            font-weight: 600;
        }
        .header p { 
            font-size: 1.1em; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px;
        }
        .question { 
            margin-bottom: 35px; 
            padding: 25px; 
            border: 1px solid #e1e5e9; 
            border-radius: 8px;
            background: #fafbfc;
        }
        .question h3 { 
            font-size: 1.3em; 
            margin-bottom: 15px; 
            color: #2c3e50;
            line-height: 1.4;
        }
        .required { 
            color: #e74c3c; 
            font-weight: bold;
        }
        .options { 
            margin-top: 15px;
        }
        .option { 
            margin: 12px 0; 
            display: flex; 
            align-items: center;
        }
        .option input[type="radio"], .option input[type="checkbox"] { 
            margin-right: 12px; 
            transform: scale(1.2);
        }
        .option label { 
            cursor: pointer; 
            font-size: 1.05em;
            display: flex;
            align-items: center;
            width: 100%;
        }
        .option label:hover { 
            color: #667eea;
        }
        input[type="text"], textarea { 
            width: 100%; 
            padding: 12px 16px; 
            border: 2px solid #e1e5e9; 
            border-radius: 6px; 
            font-size: 1em;
            transition: border-color 0.3s ease;
        }
        input[type="text"]:focus, textarea:focus { 
            outline: none; 
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        textarea { 
            resize: vertical; 
            min-height: 100px;
        }
        .submit-section { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 30px; 
            border-top: 2px solid #f1f3f4;
        }
        .submit-btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 16px 40px; 
            border: none; 
            border-radius: 8px; 
            font-size: 1.1em; 
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.3s ease;
            min-width: 200px;
        }
        .submit-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .submit-btn:disabled { 
            opacity: 0.6; 
            cursor: not-allowed;
            transform: none;
        }
        .error { 
            color: #e74c3c; 
            font-size: 0.9em; 
            margin-top: 8px;
            display: none;
        }
        .success { 
            background: #d4edda; 
            color: #155724; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            text-align: center;
            display: none;
        }
        .loading { 
            display: none; 
            text-align: center; 
            margin: 20px 0;
        }
        .spinner { 
            border: 3px solid #f3f3f3; 
            border-top: 3px solid #667eea; 
            border-radius: 50%; 
            width: 30px; 
            height: 30px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        @media (max-width: 768px) {
            .container { margin: 10px; border-radius: 8px; }
            .header, .content { padding: 25px 20px; }
            .header h1 { font-size: 1.8em; }
            .question { padding: 20px; margin-bottom: 25px; }
            .submit-btn { padding: 14px 30px; min-width: 160px; }
        }
              .thank-you {
            display: none;
            text-align: center;
            padding: 80px 30px;
        }

        .thank-you h2 {
            color: #7c3aed;
            font-size: 2.5rem;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .thank-you p {
            font-size: 1.1rem;
            color: #64748b;
            max-width: 500px;
            margin: 0 auto;
            line-height: 1.6;
        }
        ${customStyles}
    </style>
</head>
<body>
    ${trackingPixel}
    <div class="container">
        <div class="header">
            <h1>${this.escapeHtml(survey.title)}</h1>
            ${survey.description ? `<p>${this.escapeHtml(survey.description)}</p>` : ""}
        </div>
        
        <div class="content">
            <form id="surveyForm" method="POST" action="${submitUrl}${trackingParams}">
                ${this.generateQuestionsHtml(survey.questions)}
                
                <div class="submit-section">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        Submit Survey
                    </button>
                    <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p>Submitting your response...</p>
                    </div>
                    <div class="error" id="errorMessage"></div>
                    <div class="success" id="successMessage">
                        Thank you for your response! Your feedback has been submitted successfully.
                    </div>
                </div>
            </form>

              <div class="thank-you" id="thank-you">
                <h2>Thank You!</h2>
                <p>Your response has been submitted successfully. We appreciate you taking the time to share your feedback with us.</p>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('surveyForm');
        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const startTime = Date.now();

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate required fields
            const requiredFields = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (field.type === 'radio') {
                    const name = field.name;
                    const radios = form.querySelectorAll(\`input[name="\${name}"]:checked\`);
                    if (radios.length === 0) {
                        isValid = false;
                        field.closest('.question').querySelector('.error').style.display = 'block';
                        field.closest('.question').querySelector('.error').textContent = 'This field is required';
                    } else {
                        field.closest('.question').querySelector('.error').style.display = 'none';
                    }
                } else if (!field.value.trim()) {
                    isValid = false;
                    const errorEl = field.closest('.question').querySelector('.error');
                    errorEl.style.display = 'block';
                    errorEl.textContent = 'This field is required';
                } else {
                    field.closest('.question').querySelector('.error').style.display = 'none';
                }
            });

            if (!isValid) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Please fill in all required fields.';
                return;
            }

            // Show loading state
            submitBtn.style.display = 'none';
            loading.style.display = 'block';
            errorMessage.style.display = 'none';

            try {
                const formData = new FormData(form);
                const answers = [];
                
                // Convert form data to answers array
                for (let [key, value] of formData.entries()) {
                    if (key !== 'trackingId') {
                        const questionElement = form.querySelector(\`[name="\${key}"]\`);
                        const questionText = questionElement.closest('.question').querySelector('h3').textContent.replace(' *', '');
                        answers.push({
                            questionId: key,
                            question: questionText,
                            answer: value
                        });
                    }
                }

                const completionTime = Math.floor((Date.now() - startTime) / 1000);
                
                const response = await fetch('${submitUrl}${trackingParams}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        answers: answers,
                        completionTime: completionTime,
                        respondentInfo: {
                            userAgent: navigator.userAgent,
                            timestamp: new Date().toISOString()
                        }
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    form.style.display = 'none';
                     document.getElementById('thank-you').style.display = 'block';
                    successMessage.style.display = 'block';
                } else {
                    throw new Error(result.error || 'Failed to submit survey');
                }
            } catch (error) {
                console.error('Survey submission error:', error);
                submitBtn.style.display = 'block';
                loading.style.display = 'none';
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Failed to submit survey. Please try again.';
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Generate HTML for survey questions
     */
    private generateQuestionsHtml(questions: Survey["questions"]): string {
        return questions
            .map((question, index) => {
                const questionId = question.id || `q${index + 1}`;
                const required = question.required ? " *" : "";
                const requiredAttr = question.required ? "required" : "";

                let optionsHtml = "";

                switch (question.type) {
                    case "single_choice":
                        optionsHtml = `
            <div class="options">
              ${question.options
                                ?.map(
                                    (option) => `
                <div class="option">
                  <label>
                    <input type="radio" name="${questionId}" value="${this.escapeHtml(option)}" ${requiredAttr}>
                    ${this.escapeHtml(option)}
                  </label>
                </div>
              `,
                                )
                                .join("") || ""
                            }
            </div>
          `;
                        break;

                    case "text":
                        optionsHtml = `
            <input type="text" name="${questionId}" ${requiredAttr} placeholder="Enter your answer...">
          `;
                        break;

                    case "textarea":
                        optionsHtml = `
            <textarea name="${questionId}" ${requiredAttr} placeholder="Enter your detailed response..." rows="4"></textarea>
          `;
                        break;

                    case "rating":
                        const ratingOptions = question.options || [
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                        ];
                        optionsHtml = `
            <div class="options">
              ${ratingOptions
                                .map(
                                    (rating) => `
                <div class="option">
                  <label>
                    <input type="radio" name="${questionId}" value="${this.escapeHtml(rating)}" ${requiredAttr}>
                    ${this.escapeHtml(rating)}
                  </label>
                </div>
              `,
                                )
                                .join("")}
            </div>
          `;
                        break;

                    case "yes_no":
                        optionsHtml = `
            <div class="options">
              <div class="option">
                <label>
                  <input type="radio" name="${questionId}" value="Yes" ${requiredAttr}>
                  Yes
                </label>
              </div>
              <div class="option">
                <label>
                  <input type="radio" name="${questionId}" value="No" ${requiredAttr}>
                  No
                </label>
              </div>
            </div>
          `;
                        break;

                    default:
                        optionsHtml = `
            <input type="text" name="${questionId}" ${requiredAttr} placeholder="Enter your answer...">
          `;
                }

                return `
        <div class="question">
          <h3>${this.escapeHtml(question.question)}${required}</h3>
          ${optionsHtml}
          <div class="error"></div>
        </div>
      `;
            })
            .join("");
    }

    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(text: string): string {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;");
    }

    /**
     * Generate email template with survey link and tracking
     */
    generateEmailTemplate(
        survey: Survey,
        trackingId: string,
        recipientName: string = "Valued Participant",
    ): string {
        const surveyUrl = `${process.env.BASE_URL || "http://localhost:5000"}/survey/${survey.id}`;
        const trackingUrl = `${surveyUrl}?t=${trackingId}`;
        const trackingPixel = `${process.env.BASE_URL || "http://localhost:5000"}/api/track/open/${trackingId}`;

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Invitation: ${this.escapeHtml(survey.title)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">You're Invited to Participate</h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your feedback matters to us</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Dear ${this.escapeHtml(recipientName)},</p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                                We would like to invite you to participate in our survey: <strong>${this.escapeHtml(survey.title)}</strong>
                            </p>
                            
                            ${survey.description
                ? `
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #666; line-height: 1.6;">
                                ${this.escapeHtml(survey.description)}
                            </p>
                            `
                : ""
            }
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #666; line-height: 1.6;">
                                Your participation is voluntary and your responses will be kept confidential. The survey should take only a few minutes to complete.
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${trackingUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; display: inline-block;">
                                            Take Survey Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; color: #999; text-align: center;">
                                Or copy and paste this link in your browser:<br>
                                <a href="${trackingUrl}" style="color: #667eea; word-break: break-all;">${trackingUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 14px; color: #666;">
                                Thank you for your time and participation!
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                                This email was sent regarding the survey: ${this.escapeHtml(survey.title)}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Tracking pixel -->
    <img src="${trackingPixel}" width="1" height="1" style="display: none;" alt="">
</body>
</html>`;
    }
}

export const htmlSurveyService = new HtmlSurveyService();
