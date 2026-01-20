# Browser Setup - Lazy Download Implementation

This app uses Playwright's Chromium browser to analyze emails. The browser (~300MB) is downloaded on first launch rather than bundled with the app.

## How It Works

### 1. First Launch Experience
- App launches (~50MB install size)
- **Automatic check** runs in `app.vue` on mount
- If browser not installed → redirect to `/setup` page
- User sees welcome screen with download button
- Download Chromium with real-time progress tracking
- On completion → redirect to home page
- Store browser in `userData/playwright-browsers/`

### 2. Implementation Details

**Automatic Browser Check** (in `app/app.vue`):
```vue
<script setup>
const { ensureBrowserInstalled } = useBrowserSetup();

onMounted(async () => {
  await ensureBrowserInstalled(); // Auto-redirects if needed
});
</script>
```

**Setup Page** (`app/pages/setup.vue`):
- Clean, professional welcome screen
- Shows download size, time estimate, one-time notice
- Real-time progress bar (0-100%)
- Error handling with retry button
- "Skip for now" option (user can set up later)
- "Get Started" button after completion

**Browser Check Composable** (`app/composables/useBrowserSetup.ts`):
```ts
const { checkBrowserInstalled, ensureBrowserInstalled } = useBrowserSetup();

// Manual check (returns boolean)
const isInstalled = await checkBrowserInstalled();

// Auto-redirect if not installed (use in app.vue)
await ensureBrowserInstalled();
```

## Production Build

### Build the app:
```bash
npm run electron:build
```

### What gets bundled:
- Playwright package (JavaScript code) ✅
- Playwright-core ✅
- Your app code ✅
- Chromium browser ❌ (downloaded on first use)

### App Sizes:
- macOS DMG: ~60-80MB (vs ~600MB if bundled)
- Windows installer: ~50-70MB (vs ~550MB if bundled)
- Linux AppImage: ~60-80MB (vs ~600MB if bundled)

### First-Run Download:
- Size: ~300MB
- Time: 2-5 minutes (depends on internet speed)
- Location: `~/Library/Application Support/qaview-desktop/playwright-browsers/` (macOS)
- One-time only: Subsequent launches use cached browser

## Development

In development, Chromium is downloaded to `node_modules/playwright/.local-browsers/` by `npx playwright install chromium`.

In production, it's downloaded to the app's userData directory on first analysis.

## Benefits

✅ **Smaller Download**: ~50MB vs ~500MB
✅ **Faster Install**: Users get started quicker
✅ **Offline After First Use**: Browser cached locally
✅ **Auto-Updates**: Can implement browser updates independently

## Considerations

⚠️ **Requires Internet on First Analysis**: Users need connectivity for initial browser download
⚠️ **First-Run UX**: Need clear messaging about one-time setup
⚠️ **Download Can Fail**: Network issues require retry logic (implemented in dialog)

## Alternative Approaches

If you change your mind and want to bundle everything:

1. Remove lazy-download logic
2. Use the electron-builder afterPack script (see production bundling docs)
3. Accept ~500MB app size
4. Users get 100% offline experience from installation
