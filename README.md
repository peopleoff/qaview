# QAView Desktop

Email QA and analysis tool for marketing teams. Analyzes email files (.eml, .html) to validate links, check images, extract UTM parameters, and generate screenshots.

## Features

- Parse and analyze .eml and .html email files
- Validate all links with redirect chain tracking
- Extract and display UTM parameters
- Check image accessibility and dimensions
- Generate desktop (800px) and mobile (375px) screenshots
- Built-in spell checking with custom dictionaries
- QA checklist management
- Note-taking for email reviews

## Installation

### Download from GitHub Releases

Download the latest version for your platform from [GitHub Releases](https://github.com/ruslanbelyy/qaview-desktop/releases):

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `QAView-Desktop-x.x.x-arm64.dmg` |
| macOS (Intel) | `QAView-Desktop-x.x.x-x64.dmg` |
| Windows | `QAView-Desktop-x.x.x-Setup.exe` |
| Linux | `QAView-Desktop-x.x.x.AppImage` |

### Security Warnings (Unsigned Builds)

Since the app is not code-signed, you'll see security warnings on first launch:

**macOS:**
1. Open the .dmg file and drag QAView Desktop to Applications
2. Right-click the app and select "Open" (not double-click)
3. Click "Open" in the dialog that appears

**Windows:**
1. Run the installer
2. If SmartScreen appears, click "More info" → "Run anyway"

**Linux:**
1. Make the AppImage executable: `chmod +x QAView-Desktop-x.x.x.AppImage`
2. Run it: `./QAView-Desktop-x.x.x.AppImage`

### First Launch

On first launch, the app will prompt you to download Chromium (~300MB) which is used for email rendering and link validation. This is a one-time download.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Development Server

```bash
# Nuxt dev server (browser mode)
npm run dev

# Nuxt with Electron integration
npm run dev:electron
```

### Database

```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio
```

### Build

```bash
# Local macOS build (arm64)
npm run electron:build

# All platforms (requires cross-compilation setup)
npm run electron:build:prod
```

## Releasing

Releases are automated via GitHub Actions.

### Creating a Release

1. Update version in `package.json`
2. Commit changes: `git commit -am "Bump version to x.x.x"`
3. Create and push a tag:
   ```bash
   git tag vx.x.x
   git push origin vx.x.x
   ```
4. GitHub Actions will automatically:
   - Build for macOS (arm64 + x64), Windows, and Linux
   - Create a GitHub Release with all artifacts
   - Generate release notes from commits

### Manual Release Build

```bash
# Build without publishing
npm run release:build

# Build and publish to GitHub Releases (requires GH_TOKEN)
npm run release:publish
```

### Icon Generation

To regenerate app icons (if you update the design):

```bash
npm run icons:generate
```

## Tech Stack

- **Frontend**: Nuxt 3 + Vue 3 + Nuxt UI
- **Desktop**: Electron
- **Database**: SQLite with Drizzle ORM
- **Email Analysis**: Playwright (Chromium)
- **Email Parsing**: mailparser

## License

Private - All rights reserved
