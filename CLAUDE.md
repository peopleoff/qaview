# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QAView Desktop** is an Electron + Nuxt 3 desktop application for email QA and analysis targeting marketing teams. It parses email files (.eml, .html), analyzes them using Playwright-controlled Chromium, and provides comprehensive QA reporting including link validation, image checking, UTM parameter extraction, and screenshot generation.

## Key Technologies

- **Frontend**: Nuxt 3 (SSR disabled) + Vue 3 + Nuxt UI
- **Desktop**: Electron with nuxt-electron integration
- **Database**: SQLite with Drizzle ORM (snake_case convention)
- **Email Analysis**: Playwright (Chromium) for rendering and link/image validation
- **Email Parsing**: mailparser for .eml file parsing

## Development Commands

### Starting Development
```bash
npm run dev              # Nuxt dev server (browser mode)
npm run dev:electron     # Nuxt with Electron integration
npm run electron:dev     # Electron only (after building Nuxt)
```

### Database Operations
```bash
npm run db:generate      # Generate migrations from schema changes
npm run db:migrate       # Apply migrations to database
npm run db:push          # Push schema directly (dev only)
npm run db:studio        # Open Drizzle Studio GUI
```

Database location: `~/Library/Application Support/qaview-desktop/qaview.db` (macOS)

### Testing
```bash
npx playwright test                    # Run all tests
npx playwright test --headed           # Run with visible browser
npx playwright test tests/example.spec.ts  # Run specific test
npx playwright test --ui               # Interactive UI mode
npx playwright show-report            # View test report
```

### Build & Distribution
```bash
npm run generate              # Generate static Nuxt site to .output/public/
npm run electron:build        # Fast build: arm64 only, no signing (dev)
npm run electron:build:prod   # Full build: x64 + arm64, with signing (production)
```

**Build Process:**
- `npm run generate` creates static site in `.output/public/` with `index.html`
- `nuxt-electron` module also builds Electron main/preload to `dist-electron/`
- `electron:build` runs `generate` first, then packages with electron-builder
- Production app loads from `.output/public/index.html` (see electron/main.ts:16,33)

**Build Optimization:**
- Dev build (`electron:build`): ~1-2 minutes (arm64 only, no signing)
- Prod build (`electron:build:prod`): ~3-5 minutes (universal binary, signing)
- Only runtime dependencies bundled (via package.json dependencies field)
- Chromium browser excluded (~300MB), downloaded on first use

## Architecture

### Electron Main Process (`electron/`)
- **main.ts**: Electron app lifecycle, window management
- **preload.ts**: Exposes `window.electronAPI` bridge to renderer
- **ipc-handlers.ts**: All IPC communication handlers (database, file, browser operations)
- **utils/email-analyzer.ts**: Core email analysis with Playwright (link validation, screenshots, UTM parsing)
- **utils/browser-manager.ts**: Playwright browser installation and lifecycle management
- **utils/screenshot-manager.ts**: Screenshot directory creation and path management

### Nuxt Frontend (`app/`)
- **pages/**: Vue pages (index.vue for email list, emails/[id].vue for detail, setup.vue for browser install)
- **components/**: Reusable Vue components
- **composables/**:
  - `useDatabase.ts`: All database operations via IPC (wraps `window.electronAPI`)
  - `useBrowserSetup.ts`: Browser installation check and auto-redirect logic
- **assets/css/main.css**: Tailwind CSS entry point

### Database Schema (`lib/db/`)
- **schema/**: Drizzle schema definitions (emails, links, images, qaChecklist, qaNotes, spellErrors, attachments)
- **index.ts**: Database connection and query builder export
- **migrations/**: Generated SQL migrations

Schema uses `snake_case` naming via `drizzle.config.ts` casing setting.

### Key Data Models
- **emails**: Core email record with subject, filePath, screenshots, analyzed flag
- **links**: Extracted links with URL, status, redirectChain, finalUrl, utmParams, screenshot
- **images**: Image src, alt, status, dimensions (filters out 1x1 tracking pixels)
- **qaChecklist**: Default QA checklist items (8 standard items created on upload)
- **qaNotes**: User-created notes attached to emails
- **spellErrors**: Spelling/grammar errors (not yet implemented)

## IPC Communication Pattern

Frontend → Renderer Process → IPC → Main Process → Database/File/Browser

All IPC handlers follow this response pattern:
```typescript
{ success: true, data: T } | { success: false, error: string }
```

Available IPC channels (via `window.electronAPI`):
- `db:getEmails`, `db:getEmail`, `db:createEmail`, `db:updateEmail`, `db:deleteEmail`
- `db:getLinks`, `db:updateLink`, `db:createLinks`
- `db:getImages`, `db:updateImage`, `db:createImages`
- `db:getQAChecklist`, `db:updateQAChecklistItem`
- `db:getQANotes`, `db:createQANote`, `db:deleteQANote`
- `db:getSpellErrors`
- `file:select`, `email:upload`, `email:analyze`
- `browser:isInstalled`, `browser:install`

## Email Analysis Workflow

1. **Upload**: User selects .eml/.html file via `file:select` → copied to `userData/uploads/emails/`
2. **Database Record**: Email record + default 8-item QA checklist created
3. **Analysis** (`email:analyze`):
   - Parse email with mailparser (extract subject, HTML)
   - Launch Playwright Chromium browser
   - Render email HTML, take desktop (800px) and mobile (375px) screenshots
   - Extract all `<a>` links: validate, follow redirects, extract UTM params, screenshot destination
   - Extract all `<img>` images: validate accessibility, check dimensions, filter tracking pixels
   - Store all data in database with relationships
4. **Display**: Email detail page shows analysis results with screenshots, link/image validation status

## Browser Installation

**Lazy Download Strategy**: Chromium (~300MB) downloads on first use, not bundled with app.

- First launch: Auto-check in `app.vue` → redirect to `/setup` if needed
- Setup page: Download Chromium with progress tracking via `browser:install` IPC
- Storage: `userData/playwright-browsers/` (production) or `node_modules/playwright/.local-browsers/` (dev)
- Benefits: Smaller app size (~50MB vs ~500MB), faster install

See `BROWSER_SETUP.md` for full implementation details.

## Important Conventions

### Database Schema Changes
1. Modify schema files in `lib/db/schema/`
2. Run `npm run db:generate` to create migration
3. Review generated SQL in `lib/db/migrations/`
4. Run `npm run db:migrate` or `npm run db:push` (dev)

### Adding IPC Handlers
1. Add handler function in `electron/ipc-handlers.ts`
2. Add method to `ElectronAPI` interface in `electron/preload.ts`
3. Add IPC invocation in preload context bridge
4. Use via `window.electronAPI` in composables

### Electron Build Configuration
- `nuxt.config.ts`: Defines Electron build entries and Vite config
- Main/preload processes use ES modules (`type: "module"` in package.json)
- All Electron dependencies externalized in `rollupOptions.external`

## Running Tests

Playwright tests live in `tests/` directory. The project uses Playwright for E2E testing with chromium, firefox, and webkit browsers configured.

## Common Gotchas

- **SSR Disabled**: `ssr: false` in nuxt.config.ts for Electron compatibility
- **Client-Only APIs**: Check `import.meta.client` before using `window.electronAPI`
- **Database Location**: Production DB is in userData, not project root
- **Headless Mode**: Email analyzer runs `headless: false` for visibility during dev (should be `true` in production)
- **UTM Extraction**: Email ID is extracted from UTM campaign parameter (must be consistent across all links)
- **Tracking Pixels**: Images with 1x1 dimensions are filtered out during analysis
