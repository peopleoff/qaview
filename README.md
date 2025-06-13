# QA Buddy

A comprehensive email quality assurance analysis tool built with Nuxt 3. QA Buddy analyzes uploaded .eml files to check links, validate images, capture screenshots, and perform spell checking to ensure email quality before deployment.

## Features

- **Email Analysis**: Upload and parse .eml files for comprehensive QA analysis
- **Link Validation**: Check status codes, redirects, and UTM parameters
- **Image Validation**: Verify accessibility, dimensions, and loading performance
- **Screenshot Capture**: Full email and individual link screenshots using Playwright
- **QA Checklist**: Customizable checklist items for manual review
- **Notes & Comments**: Add detailed notes during the QA process
- **Spell Checking**: Built-in spell checker with custom dictionary support
- **Export Reports**: Generate detailed analysis reports

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TailwindCSS v4, shadcn-nuxt
- **Backend**: Nuxt server routes, SQLite database
- **ORM**: Drizzle ORM with migrations
- **Analysis**: Playwright (Chromium), mailparser
- **Validation**: Zod schemas throughout

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, pnpm, yarn, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd qa-buddy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env
```

4. Create data directory and set up the database:
```bash
# Create data directory for SQLite database
mkdir -p data

# Run migrations to create tables
npx drizzle-kit migrate
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Database Management

```bash
# Generate new migrations after schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Open Drizzle Studio for database inspection
npx drizzle-kit studio
```

## Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

- `/components/` - Vue components including UI library
- `/pages/` - File-based routing pages
- `/server/api/` - API endpoints for email analysis
- `/lib/db/` - Database schema and migrations
- `/server/utils/` - Email analysis engine and utilities
- `/public/uploads/` - File uploads and analysis artifacts
