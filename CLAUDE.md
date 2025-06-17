# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server (starts on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# ESLint (using @antfu/eslint-config with Nuxt integration)
npm run lint

# Database operations
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit studio      # Open Drizzle Studio
```

## Architecture Overview

**QAView** is a Nuxt 3 application for email quality assurance analysis. It parses uploaded .eml files and performs comprehensive analysis using Playwright to check links, images, and capture screenshots.

### Core Components

- **Database Layer**: SQLite with Drizzle ORM

  - Three main tables: `emails`, `links`, `images` with proper relations
  - Snake case convention for database columns
  - Migrations stored in `/lib/db/migrations/`

- **Email Analysis Engine** (`server/utils/email-analyzer.ts`):

  - Uses Playwright with Chromium to analyze email HTML content
  - Takes screenshots of full email and individual links
  - Checks link status codes, redirects, and UTM parameters
  - Validates image accessibility and dimensions
  - Stores analysis artifacts in `/public/uploads/analysis/`

- **File Upload System**:
  - Handles .eml file uploads via multipart form data
  - Files stored in `/uploads/` directory
  - Uses Zod for validation throughout the application

### Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TailwindCSS v4, shadcn-nuxt
- **Backend**: Nuxt server routes, Drizzle ORM, SQLite
- **Analysis**: Playwright (Chromium), mailparser for .eml parsing
- **Validation**: Zod schemas throughout
- **UI Components**: Reka UI, Lucide icons, color mode support

### Environment Configuration

Environment variables are managed through `lib/env.ts` with Zod validation:

- `NODE_ENV`: development | production
- `DB_FILE_NAME`: SQLite database file path

### File Structure Patterns

- API routes in `server/api/` follow RESTful conventions
- Database schemas are modular in `lib/db/schema/`
- UI components use shadcn-nuxt structure in `components/ui/`
- Pages follow Nuxt file-based routing
- Types are centralized in `types/` directory
