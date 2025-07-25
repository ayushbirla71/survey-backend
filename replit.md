# Survey Platform - Replit.md

## Overview

This is a Node.js Express backend API server for a survey platform with SQLite database and bulk email functionality. The server provides a complete REST API matching the provided documentation specifications, including survey management, audience handling, dashboard analytics, and email distribution capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 25, 2025)

**Demo Data Migration and Dashboard Fixes:**
✓ Successfully migrated project from Replit Agent to Replit environment
✓ Added 10 comprehensive demo surveys with realistic data for dashboard testing
✓ Fixed storage TypeScript errors and date formatting inconsistencies
✓ Resolved dashboard API errors - all endpoints now working correctly
✓ Demo surveys include various categories: Customer Feedback, HR & Workplace, Product Research, Market Research, UX Research, Marketing, Healthcare
✓ Survey data includes proper response counts, email statistics, and completion tracking
✓ Dashboard now displays populated recent surveys list with proper formatting
✓ All API endpoints returning successful responses with comprehensive survey data
✓ Generated 3,935 realistic survey responses across all demo surveys
✓ Survey details now show complete analytics: response counts, completion rates, response times
✓ Individual survey responses available with proper pagination and realistic answer data
✓ Dashboard analytics fully functional with meaningful charts and demographics data

## Previous Changes (July 24, 2025)

**HTML Survey Generation and Email Automation System:**
✓ Enhanced database schema with HTML storage fields (html_content, public_url, emails_sent, emails_opened, response_count)
✓ Created comprehensive HTML survey generation service with embedded styling and JavaScript
✓ Implemented automatic email sending after HTML creation with tracking integration
✓ Added new API endpoints for HTML survey management and email campaign automation
✓ Built complete email tracking system connected to survey model
✓ Email templates now use HTML service for consistent branding and tracking
✓ Created public survey access URLs with automatic tracking parameter support
✓ Added survey HTML download functionality for offline distribution
✓ Updated survey details API to include email statistics and campaign information
✓ Development mode email simulation with tracking record creation
✓ Complete end-to-end workflow: Create Survey → Generate HTML → Auto-send Emails → Track Analytics

**Previous System Improvements:**
- Fixed OpenAI dependency issues with graceful fallback when API key is missing
- Converted PostgreSQL schema to SQLite for development compatibility
- Resolved TypeScript compilation errors and module imports
- Updated questionService.js to handle missing OpenAI credentials properly
- Created basic React home page for frontend testing
- Verified backend API endpoints are working correctly
- Database tables initialized with proper SQLite structure
- Sample data available for development testing

## System Architecture

### Backend Architecture (Current Implementation)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with Better SQLite3 driver
- **File Handling**: Multer for file uploads (CSV/Excel import/export)
- **Email Service**: Nodemailer for bulk survey email distribution
- **Response Format**: Standardized JSON responses with success/error handling
- **File Processing**: CSV/Excel parsing and PDF report generation
- **CORS Support**: Cross-origin resource sharing enabled

### Database Schema
- **SQLite Tables**: Users, Surveys, Survey Responses, Audience Members, Audience Segments
- **Sample Data**: Development environment includes sample data for testing
- **Indexing**: Optimized indexes for performance on key lookup fields

### API Endpoints (Complete Implementation)
- **Dashboard APIs**: Statistics, charts, and recent surveys
- **Survey APIs**: CRUD operations, duplication, email sending, results
- **Public Survey APIs**: Public access for survey forms and submissions
- **Audience APIs**: Member management, statistics, import/export, segmentation
- **File Operations**: CSV/Excel/PDF export capabilities
- **Health Check**: System status monitoring endpoint

### Public Survey Form APIs
- **GET /api/public/survey/:id** - Get survey data for public forms (no auth required)
- **POST /api/public/survey/:id/submit** - Submit survey responses from HTML forms
- **GET /api/public/survey/:id/thank-you** - Get thank you message after completion

### Dynamic Question Generation APIs (New Addition)
- **POST /api/questions/generate** - Generate questions using OpenAI or static templates
- **GET /api/questions/categories** - Get available question categories
- **GET /api/questions/static/:category** - Get static questions for specific category
- **GET /api/questions/config** - Get question generation configuration and status

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users**: Authentication and user management
- **Surveys**: Survey metadata, questions, and configuration
- **Survey Responses**: User responses with analytics data
- **Audience Members**: Target audience with demographic data
- **Audience Segments**: Filtered groups for targeted surveys

### API Layer (`server/routes.ts`)
- RESTful API endpoints for all CRUD operations
- Standardized response format with success/error handling
- Pagination support for large datasets
- File upload endpoints for bulk audience import
- Dashboard analytics endpoints

### Storage Layer (`server/storage.ts`)
- Database abstraction interface (IStorage)
- SQLite implementation for development
- PostgreSQL support through same interface
- Sample data generation for development environment

### Service Layer
- **Email Service**: Survey invitation emails with templates
- **File Service**: CSV/Excel parsing for audience import
- **Question Service**: OpenAI integration with static fallback for dynamic question generation
- **Validation Middleware**: Request/response validation with Zod

### UI Components
- Complete Shadcn/ui component library
- Responsive design with Tailwind CSS
- Dark/light mode support through CSS variables
- Mobile-optimized with custom hooks

## Data Flow

1. **Survey Creation**: Frontend form → API validation → Database storage
2. **Audience Management**: CSV upload → File parsing → Batch database insert
3. **Survey Distribution**: Audience selection → Email service → Survey links
4. **Response Collection**: Public survey pages → Response validation → Database storage
5. **Analytics**: Database aggregation → API endpoints → Dashboard visualization

## External Dependencies

### Core Framework Dependencies
- React 18+ with TypeScript support
- Express.js for backend API
- Drizzle ORM for database operations
- Vite for frontend build tooling

### Database & Storage
- PostgreSQL (production) via Neon Database
- Better SQLite3 (development)
- Connect-PG-Simple for session management

### UI & Styling
- Tailwind CSS for styling
- Radix UI primitives for accessibility
- Lucide React for icons
- React Hook Form for form handling

### Development Tools
- TSX for TypeScript execution
- ESBuild for backend bundling
- Replit integration plugins for development

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite bundles React app to `dist/public`
2. **Backend Build**: ESBuild bundles Express server to `dist/index.js`
3. **Database Migration**: Drizzle-kit handles schema migrations

### Environment Configuration
- Development: SQLite database with sample data
- Production: PostgreSQL with environment variables
- Database URL configuration through `DATABASE_URL` environment variable

### Scaling Considerations
- Database connections handled by connection pooling
- File uploads limited to 10MB with proper error handling
- Session storage in PostgreSQL for horizontal scaling
- API responses cached where appropriate through React Query

### Monitoring & Logging
- Request/response logging middleware
- Error handling with standardized error responses
- Development-specific logging for debugging