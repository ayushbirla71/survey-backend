import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { generateSampleData } from "./database/migrations.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Increase payload limits for file uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Generate sample data for development
  if (process.env.NODE_ENV === "development") {
    try {
      generateSampleData();
      log("Sample data initialized for development");
    } catch (error) {
      log(
        "Sample data already exists or error occurred: " +
        (error as Error).message,
      );
    }
  }

  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error ${status}: ${message}`);
    res.status(status).json({
      success: false,
      error: message,
      code: "SRV_001",
    });
  });

  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Server configuration
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`Survey Platform API server running at http://localhost:${port}`);
    log(`Database: SQLite (database.sqlite)`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    if (process.env.NODE_ENV === 'development') {
      log('Sample data available for testing');
      log('API Documentation: Check the provided API docs');
    }
  });

  // server.listen({
  //   port,
  //   host: "0.0.0.0",
  //   reusePort: true,
  // }, () => {
  //   log(`Survey Platform API server running on port ${port}`);
  //   log(`Database: SQLite (database.sqlite)`);
  //   log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  //   if (process.env.NODE_ENV === 'development') {
  //     log('Sample data available for testing');
  //     log('API Documentation: Check the provided API docs');
  //   }
  // });

})();
