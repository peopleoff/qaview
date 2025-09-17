# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QAView is a comprehensive email quality assurance analysis tool built with Nuxt 3. It analyzes uploaded .eml files to check links, validate images, capture screenshots, and perform spell checking to ensure email quality before deployment.

## Core Architecture

### Frontend Stack
- **Nuxt 3** with SSR disabled (SPA mode)
- **Vue 3** with Composition API
- **TailwindCSS v4** for styling
- **shadcn-nuxt** for UI components
- **Reka UI** as the base component library
- **@tanstack/vue-table** for data tables
- **vee-validate + zod** for form validation

### Backend & Database
- **Nuxt server routes** for API endpoints
- **SQLite** database with **Drizzle ORM**
- **Playwright** (Chromium) for email analysis and screenshots
- **mailparser** for .eml file parsing
- **typo-js** for spell checking with custom dictionaries

### Database Schema
Core entities include:
- `emails` - Main email records
- `attachments` - File attachments from emails
- `images` - Analyzed image data with status codes
- `links` - Link analysis with redirects and UTM tracking
- `qaChecklist` - Customizable QA checklist items
- `qaNotes` - Notes and comments during QA process
- `spellErrors` - Spell check results

## Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run preview            # Preview production build

# Linting
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues

# Database Operations
npm run db:setup           # Generate schemas and run migrations
npm run db:generate        # Generate new migrations after schema changes
npm run db:migrate         # Apply migrations to database
npm run db:studio          # Open Drizzle Studio for database inspection
npm run db:reset           # Reset database (delete data/db.sqlite then run db:setup)
```

## Key Components & Architecture

### Email Analysis Engine
The core analysis logic is in `server/utils/email-analyzer.ts`:
- Uses Playwright to render email HTML and capture screenshots
- Analyzes all links for status codes, redirects, and UTM parameters
- Validates images and checks accessibility
- Performs spell checking with custom dictionary support
- Generates both desktop (800px) and mobile (375px) screenshots

### API Structure
- `/server/api/email/` - Main email CRUD operations
- `/server/api/email/[id]/analyze/` - Trigger analysis for specific email
- `/server/api/email/[id]/attachments/` - Manage email attachments
- `/server/api/email/[id]/qa-checklist/` - QA checklist management
- `/server/api/email/[id]/qa-notes/` - Notes and comments
- `/server/api/custom-dictionary/` - Spell check dictionary management

### State Management
Uses Vue's Composition API with composables:
- `useEmails()` - Email upload, fetching, and management
- Global state managed through reactive refs

### UI Components
- Custom UI components built on Reka UI in `/components/ui/`
- Email-specific components in `/components/Email/`
- QA-specific components in `/components/QA/`
- Form components in `/components/Form/`

## Configuration Notes

### Environment Variables
Required environment variables (defined in `lib/env.ts`):
- `NODE_ENV` - "development" or "production"
- `DB_FILE_NAME` - Path to SQLite database file

### ESLint Configuration
Uses @antfu/eslint-config with custom rules:
- Enforces consistent type definitions over interfaces
- Limits Vue template attributes per line
- Requires camelCase/PascalCase/kebab-case filenames
- Warns on console usage
- Prevents process.env access (use lib/env.ts instead)

### Database Configuration
- SQLite database with snake_case column naming
- Migrations stored in `lib/db/migrations/`
- Schema files organized by entity in `lib/db/schema/`

## File Upload & Analysis Flow

1. .eml files uploaded via `/api/email` POST endpoint
2. Email parsed using mailparser and stored in database
3. Analysis triggered via `/api/email/[id]/analyze/` endpoint
4. Playwright renders HTML, captures screenshots, and analyzes content
5. Results stored in respective tables (links, images, spellErrors)
6. Screenshots saved to `/public/uploads/analysis/email-{id}/`

## Testing & Quality

- No specific test framework configured - check codebase for testing approach
- ESLint enforces code quality and consistency
- Type safety enforced through TypeScript and Zod schemas
- Database schema validation through Drizzle ORM

## Common Patterns

- All API routes use Zod for request/response validation
- Database operations use Drizzle ORM with prepared statements
- Error handling includes proper HTTP status codes
- File uploads handled through FormData with proper validation
- Screenshots and analysis artifacts stored in organized directory structure