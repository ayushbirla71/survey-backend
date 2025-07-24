import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  calculatePagination,
} from "./utils/responseHelper";
import emailService from "./services/emailService";
import fileService from "./services/fileService";
import * as questionService from "./services/questionService.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Error handling middleware
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Dashboard APIs
  app.get(
    "/api/dashboard/stats",
    asyncHandler(async (req: any, res: any) => {
      const stats = await storage.getDashboardStats();
      res.json(successResponse(stats));
    }),
  );

  app.get(
    "/api/dashboard/charts",
    asyncHandler(async (req: any, res: any) => {
      const charts = await storage.getDashboardCharts();
      res.json(successResponse(charts));
    }),
  );

  app.get(
    "/api/dashboard/recent-surveys",
    asyncHandler(async (req: any, res: any) => {
      const surveys = await storage.getRecentSurveys();
      res.json(successResponse(surveys));
    }),
  );

  // Survey APIs
  app.get(
    "/api/surveys",
    asyncHandler(async (req: any, res: any) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      const status = req.query.status || "";
      const category = req.query.category || "";

      const filters = { page, limit, search, status, category };
      const result = await storage.getSurveys(filters);
      const pagination = calculatePagination(page, limit, result.total);

      res.json(paginatedResponse(result.surveys, pagination));
    }),
  );

  app.get(
    "/api/surveys/:id",
    asyncHandler(async (req: any, res: any) => {
      const survey = await storage.getSurvey(req.params.id);
      if (!survey) {
        return res
          .status(404)
          .json(errorResponse("Survey not found", "RES_001"));
      }
      res.json(successResponse(survey));
    }),
  );

  app.post(
    "/api/surveys",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.createSurvey(req.body);
        res.status(201).json(successResponse(survey));
      } catch (error) {
        res.status(400).json(errorResponse(error.message, "VAL_001"));
      }
    }),
  );

  app.put(
    "/api/surveys/:id",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.updateSurvey(req.params.id, req.body);
        res.json(successResponse(survey));
      } catch (error) {
        res.status(400).json(errorResponse(error.message, "VAL_001"));
      }
    }),
  );

  app.delete(
    "/api/surveys/:id",
    asyncHandler(async (req: any, res: any) => {
      try {
        await storage.deleteSurvey(req.params.id);
        res.json(successResponse({ message: "Survey deleted successfully" }));
      } catch (error) {
        res.status(400).json(errorResponse(error.message, "RES_001"));
      }
    }),
  );

  app.post(
    "/api/surveys/:id/duplicate",
    asyncHandler(async (req: any, res: any) => {
      try {
        const duplicatedSurvey = await storage.duplicateSurvey(req.params.id);
        res.json(successResponse(duplicatedSurvey));
      } catch (error) {
        res.status(400).json(errorResponse(error.message, "RES_001"));
      }
    }),
  );

  app.post(
    "/api/surveys/:id/send",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.getSurvey(req.params.id);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        const { campaignName, selectedAudience } = req.body;

        // Get audience members (either selected IDs or filtered audience)
        let recipients = [];
        if (selectedAudience && selectedAudience.length > 0) {
          // Get specific audience members by IDs
          for (const memberId of selectedAudience) {
            const member = await storage.getAudienceMember(memberId);
            if (member) recipients.push(member);
          }
        } else {
          // Get audience based on survey criteria
          const audienceFilters = {
            page: 1,
            limit: survey.targetCount || 1000,
            ageGroup: survey.audienceCriteria?.ageGroups?.[0] || "",
            gender: survey.audienceCriteria?.genders?.[0] || "",
            country: survey.audienceCriteria?.locations?.[0] || "",
            industry: survey.audienceCriteria?.industries?.[0] || "",
          };

          const audienceResult =
            await storage.getAudienceMembers(audienceFilters);
          recipients = audienceResult.members;
        }

        if (recipients.length === 0) {
          return res
            .status(400)
            .json(
              errorResponse("No recipients found for this survey", "VAL_001"),
            );
        }

        // Create campaign and send emails with tracking
        const result = await emailService.createCampaignAndSendEmails(
          survey,
          recipients,
          campaignName || `Campaign for ${survey.title}`,
          process.env.USER_ID || "default-user",
        );

        res.json(
          successResponse({
            campaignId: result.campaignId,
            sentCount: result.sent,
            failedCount: result.failed,
            totalRecipients: recipients.length,
            message: `Survey campaign created and sent to ${result.sent} recipients`,
            errors: result.errors,
          }),
        );
      } catch (error) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  // Survey Results APIs
  app.get(
    "/api/surveys/:id/results",
    asyncHandler(async (req: any, res: any) => {
      try {
        const results = await storage.getSurveyResults(req.params.id);
        res.json(successResponse(results));
      } catch (error) {
        res.status(404).json(errorResponse(error.message, "RES_001"));
      }
    }),
  );

  app.get(
    "/api/surveys/:id/responses",
    asyncHandler(async (req: any, res: any) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const filters = { page, limit };
      const result = await storage.getSurveyResponses(req.params.id, filters);
      const pagination = calculatePagination(page, limit, result.total);

      res.json(paginatedResponse(result.responses, pagination));
    }),
  );

  app.get(
    "/api/surveys/:id/export",
    asyncHandler(async (req: any, res: any) => {
      const format = req.query.format || "csv";
      const surveyId = req.params.id;

      try {
        const results = await storage.getSurveyResults(surveyId);

        let fileBuffer: any;
        let filename: string;
        let contentType: string;

        switch (format) {
          case "csv":
            const csvHeaders = ["Question", "Answer", "Count", "Percentage"];
            const csvData = results.questionResults.flatMap((q: any) =>
              q.data
                ? q.data.map((item: any) => ({
                  Question: q.question,
                  Answer: item.option,
                  Count: item.count,
                  Percentage: `${item.percentage}%`,
                }))
                : [],
            );
            fileBuffer = Buffer.from(
              fileService.generateCSV(csvData, csvHeaders),
            );
            filename = `survey-${surveyId}-results.csv`;
            contentType = "text/csv";
            break;

          case "excel":
            const excelData = results.questionResults.flatMap((q: any) =>
              q.data
                ? q.data.map((item: any) => ({
                  Question: q.question,
                  Answer: item.option,
                  Count: item.count,
                  Percentage: `${item.percentage}%`,
                }))
                : [],
            );
            fileBuffer = fileService.generateExcel(excelData, "Survey Results");
            filename = `survey-${surveyId}-results.xlsx`;
            contentType =
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            break;

          case "pdf":
            fileBuffer = Buffer.from(fileService.generatePDF(results));
            filename = `survey-${surveyId}-results.pdf`;
            contentType = "application/pdf";
            break;

          case "json":
            fileBuffer = Buffer.from(JSON.stringify(results, null, 2));
            filename = `survey-${surveyId}-results.json`;
            contentType = "application/json";
            break;

          default:
            return res
              .status(400)
              .json(errorResponse("Invalid format specified", "VAL_002"));
        }

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Content-Type", contentType);
        res.send(fileBuffer);
      } catch (error) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  // Audience APIs
  app.get(
    "/api/audience",
    asyncHandler(async (req: any, res: any) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || "";
      const ageGroup = req.query.ageGroup || "";
      const gender = req.query.gender || "";
      const country = req.query.country || "";
      const industry = req.query.industry || "";

      const filters = {
        page,
        limit,
        search,
        ageGroup,
        gender,
        country,
        industry,
      };
      const result = await storage.getAudienceMembers(filters);
      const pagination = calculatePagination(page, limit, result.total);

      res.json(paginatedResponse(result.members, pagination));
    }),
  );

  app.get(
    "/api/audience/stats",
    asyncHandler(async (req: any, res: any) => {
      const stats = await storage.getAudienceStats();
      res.json(successResponse(stats));
    }),
  );

  app.post(
    "/api/audience/import",
    upload.single("file"),
    asyncHandler(async (req: any, res: any) => {
      if (!req.file) {
        return res
          .status(400)
          .json(errorResponse("No file uploaded", "VAL_001"));
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      try {
        let parseResult;

        if (fileExtension === ".csv") {
          parseResult = await fileService.parseCSV(filePath);
        } else if (fileExtension === ".xlsx") {
          parseResult = await fileService.parseExcel(filePath);
        } else {
          return res
            .status(400)
            .json(
              errorResponse(
                "Unsupported file format. Please use CSV or Excel files.",
                "VAL_002",
              ),
            );
        }

        // Import the data
        const importResult = await storage.createAudienceMembers(
          parseResult.data,
        );

        // Merge parsing errors with import errors
        const allErrors = [...parseResult.errors, ...importResult.errors];

        res.json(
          successResponse({
            imported: importResult.imported,
            skipped: importResult.skipped,
            errors: allErrors,
          }),
        );
      } catch (error) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      } finally {
        // Clean up uploaded file
        await fileService.cleanupFile(filePath);
      }
    }),
  );

  app.get(
    "/api/audience/export",
    asyncHandler(async (req: any, res: any) => {
      const format = req.query.format || "csv";
      const ageGroup = req.query.ageGroup || "";
      const gender = req.query.gender || "";
      const country = req.query.country || "";
      const industry = req.query.industry || "";

      try {
        const filters = {
          page: 1,
          limit: 10000, // Large limit to get all data
          search: "",
          ageGroup,
          gender,
          country,
          industry,
        };

        const result = await storage.getAudienceMembers(filters);

        let fileBuffer: any;
        let filename: string;
        let contentType: string;

        if (format === "csv") {
          const csvHeaders = [
            "firstName",
            "lastName",
            "email",
            "phone",
            "ageGroup",
            "gender",
            "city",
            "state",
            "country",
            "industry",
            "jobTitle",
            "education",
            "income",
          ];
          fileBuffer = Buffer.from(
            fileService.generateCSV(result.members, csvHeaders),
          );
          filename = "audience-export.csv";
          contentType = "text/csv";
        } else if (format === "excel") {
          fileBuffer = fileService.generateExcel(
            result.members,
            "Audience Members",
          );
          filename = "audience-export.xlsx";
          contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
          return res
            .status(400)
            .json(errorResponse("Invalid format specified", "VAL_002"));
        }

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Content-Type", contentType);
        res.send(fileBuffer);
      } catch (error) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  app.post(
    "/api/audience/segments",
    asyncHandler(async (req: any, res: any) => {
      try {
        const segment = await storage.createAudienceSegment(req.body);
        res.status(201).json(successResponse(segment));
      } catch (error) {
        res.status(400).json(errorResponse(error.message, "VAL_001"));
      }
    }),
  );

  app.get(
    "/api/audience/segments",
    asyncHandler(async (req: any, res: any) => {
      const segments = await storage.getAudienceSegments();
      res.json(successResponse(segments));
    }),
  );

  // Public Survey APIs (for survey forms - no authentication required)
  app.get(
    "/api/public/survey/:id",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.getSurvey(req.params.id);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        // Track survey access if tracking ID is provided
        const trackingId = req.query.t;
        if (trackingId) {
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers["user-agent"];
          await storage.trackSurveyAccess(
            survey.id,
            trackingId,
            ipAddress,
            userAgent,
          );
        }

        // Only return public survey data needed for form
        const publicSurvey = {
          id: survey.id,
          title: survey.title,
          description: survey.description,
          category: survey.category,
          questions: survey.questions,
          status: survey.status,
        };

        res.json(successResponse(publicSurvey));
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  app.post(
    "/api/public/survey/:id/submit",
    asyncHandler(async (req: any, res: any) => {
      try {
        const surveyId = req.params.id;
        const { answers, completionTime, respondentInfo } = req.body;

        // Validate survey exists
        const survey = await storage.getSurvey(surveyId);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        // Validate required fields
        if (!answers || !Array.isArray(answers)) {
          return res
            .status(400)
            .json(errorResponse("Answers are required", "VAL_001"));
        }

        // Create survey response
        const responseData = {
          surveyId,
          answers,
          completionTime: completionTime || 0,
          ipAddress: req.ip || req.connection.remoteAddress,
          respondentInfo: respondentInfo || {},
        };

        const response = await storage.createSurveyResponse(responseData);

        res.json(
          successResponse({
            id: response.id,
            message: "Survey response submitted successfully",
            submittedAt: response.submittedAt,
          }),
        );
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  app.get(
    "/api/public/survey/:id/thank-you",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.getSurvey(req.params.id);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        res.json(
          successResponse({
            title: survey.title,
            message: "Thank you for completing the survey!",
            category: survey.category,
          }),
        );
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  // Question Generation APIs
  app.post(
    "/api/questions/generate",
    asyncHandler(async (req: any, res: any) => {
      try {
        const { category, description, questionCount } = req.body;

        if (!category) {
          return res
            .status(400)
            .json(errorResponse("Category is required", "VAL_001"));
        }

        const questions = await questionService.generateQuestions(
          category,
          description || "",
          questionCount || 5,
        );

        res.json(
          successResponse({
            category,
            description,
            questionCount: questions.length,
            questions,
            generatedWith: process.env.OPENAI_API_KEY ? "openai" : "static",
          }),
        );
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  app.get(
    "/api/questions/categories",
    asyncHandler(async (req: any, res: any) => {
      const categories = questionService.getAvailableCategories();
      res.json(successResponse(categories));
    }),
  );

  app.get(
    "/api/questions/static/:category",
    asyncHandler(async (req: any, res: any) => {
      try {
        const category = req.params.category;
        const questions = questionService.getStaticQuestions(category);

        res.json(
          successResponse({
            category,
            questions,
            generatedWith: "static",
          }),
        );
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  app.get(
    "/api/questions/config",
    asyncHandler(async (req: any, res: any) => {
      const { default: config } = await import("./config.js");
      const openaiStatus = await questionService.testOpenAIConnection();

      res.json(
        successResponse({
          mode: config.questionGeneration.mode,
          openaiConnected: openaiStatus.connected,
          openaiError: openaiStatus.error || null,
          availableCategories: questionService.getAvailableCategories(),
          settings: {
            openai: config.questionGeneration.openai,
            static: config.questionGeneration.static,
          },
        }),
      );
    }),
  );

  // Email Campaign APIs
  app.get(
    "/api/surveys/:surveyId/campaigns",
    asyncHandler(async (req: any, res: any) => {
      const campaigns = await storage.getEmailCampaigns(req.params.surveyId);
      res.json(successResponse(campaigns));
    }),
  );

  app.get(
    "/api/campaigns",
    asyncHandler(async (req: any, res: any) => {
      const campaigns = await storage.getEmailCampaigns();
      res.json(successResponse(campaigns));
    }),
  );

  app.get(
    "/api/campaigns/:campaignId",
    asyncHandler(async (req: any, res: any) => {
      const campaign = await storage.getEmailCampaign(req.params.campaignId);
      if (!campaign) {
        return res
          .status(404)
          .json(errorResponse("Campaign not found", "RES_001"));
      }
      res.json(successResponse(campaign));
    }),
  );

  app.get(
    "/api/campaigns/:campaignId/analytics",
    asyncHandler(async (req: any, res: any) => {
      const analytics = await storage.getCampaignAnalytics(
        req.params.campaignId,
      );
      if (!analytics) {
        return res
          .status(404)
          .json(errorResponse("Campaign not found", "RES_001"));
      }
      res.json(successResponse(analytics));
    }),
  );

  // Email Tracking APIs
  app.get(
    "/api/track/open/:trackingId",
    asyncHandler(async (req: any, res: any) => {
      try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];

        await storage.trackEmailOpen(
          req.params.trackingId,
          ipAddress,
          userAgent,
        );

        // Return a transparent 1x1 pixel image
        const transparentPixel = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          "base64",
        );

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": transparentPixel.length,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        });
        res.end(transparentPixel);
      } catch (error) {
        // Return transparent pixel even on error to avoid broken images
        const transparentPixel = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          "base64",
        );
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": transparentPixel.length,
        });
        res.end(transparentPixel);
      }
    }),
  );

  // Categories API
  app.get(
    "/api/categories",
    asyncHandler(async (req: any, res: any) => {
      const categories = await storage.getCategories();
      res.json(successResponse(categories));
    }),
  );

  // HTML Survey APIs
  app.post(
    "/api/surveys/:id/create-html",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.getSurvey(req.params.id);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        const { htmlSurveyService } = await import("./services/htmlService.js");
        const { sendBulkSurveyEmails } = await import(
          "./services/emailService.js"
        );

        // Generate HTML content
        const htmlContent = htmlSurveyService.generateSurveyHtml(survey);

        // Store HTML in database
        const htmlResult = await storage.createSurveyHtml(
          req.params.id,
          htmlContent,
        );

        // Get audience criteria from request or survey
        const {
          // selectedAudience,
          campaignName,
          autoSendEmails = true,
        } = req.body;

        console.log("bodysss", req.body);
        let emailResult = null;
        const selectedAudience = [
          {
            "id": "a3fdb0a5-337e-46cc-b07c-690dc81f674b",
            "firstName": "Ayush",
            "lastName": "Birla",
            "email": "Ayushbirla71@gmail.com",
            "phone": "+91-9876543210",
            "ageGroup": "25-34",
            "gender": "Male",
            "city": "Indore",
            "state": "Madhya Pradesh",
            "country": "India",
            "industry": "IT Sector",
            "jobTitle": "Software Engineer",
            "education": "Bachelor's",
            "income": "₹6L–₹10L",
            "joinedDate": "2025-07-24 16:18:07",
            "isActive": 1,
            "lastActivity": null,
            "tags": [
              "IT Sector",
              "25-34",
              "Male"
            ]
          },
          {
            "id": "8c62a341-3522-44e9-bd7a-1220bd0d5ea9",
            "firstName": "Priya",
            "lastName": "Mehra",
            "email": "priya.mehra@example.com",
            "phone": "+91-9812345678",
            "ageGroup": "18-24",
            "gender": "Female",
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "industry": "Education",
            "jobTitle": "Student",
            "education": "Bachelor's (Pursuing)",
            "income": "₹0–₹1L",
            "joinedDate": "2025-07-24 16:18:07",
            "isActive": 1,
            "lastActivity": null,
            "tags": [
              "Education",
              "18-24",
              "Female"
            ]
          },
          {
            "id": "06544a98-acce-4228-81cb-257f7c0b6d5e",
            "firstName": "Ravi",
            "lastName": "Kumar",
            "email": "ravi.kumar@xyz.com",
            "phone": "+91-9900112233",
            "ageGroup": "35-44",
            "gender": "Male",
            "city": "Patna",
            "state": "Bihar",
            "country": "India",
            "industry": "Government",
            "jobTitle": "Bank Manager",
            "education": "Master's",
            "income": "₹10L–₹15L",
            "joinedDate": "2025-07-24 16:18:07",
            "isActive": 1,
            "lastActivity": null,
            "tags": [
              "Government",
              "35-44",
              "Male"
            ]
          },
          {
            "id": "cb022f7f-d841-4879-9e56-06369493fb94",
            "firstName": "Neha",
            "lastName": "Sharma",
            "email": "neha.sharma@email.in",
            "phone": "+91-8888777766",
            "ageGroup": "25-34",
            "gender": "Female",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "industry": "Finance",
            "jobTitle": "Chartered Accountant",
            "education": "CA",
            "income": "₹12L–₹18L",
            "joinedDate": "2025-07-24 16:18:07",
            "isActive": 1,
            "lastActivity": null,
            "tags": [
              "Finance",
              "25-34",
              "Female"
            ]
          },
          {
            "id": "e7868e94-9545-4aa1-82ef-cdf7bc09f121",
            "firstName": "Arjun",
            "lastName": "Reddy",
            "email": "arjun.reddy@example.in",
            "phone": "+91-9988776655",
            "ageGroup": "25-34",
            "gender": "Male",
            "city": "Hyderabad",
            "state": "Telangana",
            "country": "India",
            "industry": "Healthcare",
            "jobTitle": "Dentist",
            "education": "BDS",
            "income": "₹8L–₹12L",
            "joinedDate": "2025-07-24 16:18:07",
            "isActive": 1,
            "lastActivity": null,
            "tags": [
              "Healthcare",
              "25-34",
              "Male"
            ]
          },
        ];
        if (autoSendEmails && selectedAudience && selectedAudience.length > 0) {
          // Auto-send emails after HTML creation
          try {
            emailResult = await sendBulkSurveyEmails(
              req.params.id,
              selectedAudience,
              campaignName || `${survey.title} Campaign`,
              survey,
            );

            // Update survey stats
            await storage.updateSurveyStats(req.params.id, {
              emailsSent: emailResult.sentCount,
              responseCount: 0,
            });
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
            // Continue even if email fails
          }
        }

        res.json(
          successResponse({
            survey: htmlResult,
            email: emailResult,
            message: `HTML survey created successfully${emailResult ? ` and sent to ${emailResult.sentCount} recipients` : ""}`,
          }),
        );
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  // Get Survey HTML
  app.get(
    "/survey/:id",
    asyncHandler(async (req: any, res: any) => {
      try {
        const htmlContent = await storage.getSurveyHtml(req.params.id);
        if (!htmlContent) {
          return res
            .status(404)
            .send(
              "<h1>Survey not found</h1><p>The requested survey could not be found.</p>",
            );
        }

        // Track survey access if tracking ID is provided
        const trackingId = req.query.t;
        if (trackingId) {
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers["user-agent"];
          await storage.trackSurveyAccess(
            req.params.id,
            trackingId,
            ipAddress,
            userAgent,
          );
        }

        res.setHeader("Content-Type", "text/html");
        res.send(htmlContent);
      } catch (error: any) {
        res.status(500).send("<h1>Error</h1><p>Failed to load survey.</p>");
      }
    }),
  );

  // Download Survey HTML
  app.get(
    "/api/surveys/:id/download-html",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.getSurvey(req.params.id);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        const htmlContent = await storage.getSurveyHtml(req.params.id);
        if (!htmlContent) {
          return res
            .status(404)
            .json(
              errorResponse(
                "HTML content not found. Please create HTML version first.",
                "RES_001",
              ),
            );
        }

        const filename = `${survey.title.replace(/[^a-zA-Z0-9]/g, "_")}_survey.html`;

        res.setHeader("Content-Type", "text/html");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.send(htmlContent);
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  // Get Survey with HTML and Email Stats
  app.get(
    "/api/surveys/:id/details",
    asyncHandler(async (req: any, res: any) => {
      try {
        const survey = await storage.getSurvey(req.params.id);
        if (!survey) {
          return res
            .status(404)
            .json(errorResponse("Survey not found", "RES_001"));
        }

        // Get email campaigns for this survey
        const campaigns = await storage.getEmailCampaigns(req.params.id);

        // Get HTML status
        const htmlContent = await storage.getSurveyHtml(req.params.id);
        const hasHtml = !!htmlContent;

        // Calculate total email stats
        const totalEmailsSent = campaigns.reduce(
          (sum, c) => sum + (c.sent_count || 0),
          0,
        );
        const totalEmailsOpened = campaigns.reduce(
          (sum, c) => sum + (c.opened_count || 0),
          0,
        );
        const openRate =
          totalEmailsSent > 0
            ? Math.round((totalEmailsOpened / totalEmailsSent) * 100)
            : 0;

        const enhancedSurvey = {
          ...survey,
          hasHtml,
          publicUrl: hasHtml ? `/survey/${survey.id}` : null,
          emailStats: {
            totalSent: totalEmailsSent,
            totalOpened: totalEmailsOpened,
            openRate,
            campaignCount: campaigns.length,
          },
          campaigns: campaigns.map((c) => ({
            id: c.id,
            name: c.campaign_name,
            sentCount: c.sent_count,
            openedCount: c.opened_count,
            status: c.status,
            sentAt: c.sent_at,
          })),
        };

        res.json(successResponse(enhancedSurvey));
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message, "SRV_001"));
      }
    }),
  );

  // Health check endpoint
  app.get("/api/health", (req: any, res: any) => {
    res.json(
      successResponse({ status: "OK", timestamp: new Date().toISOString() }),
    );
  });

  // Global error handler
  app.use((error: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", error);
    res.status(500).json(errorResponse("Internal server error", "SRV_001"));
  });

  const httpServer = createServer(app);
  return httpServer;
}
