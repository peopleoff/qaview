import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { app } from "electron";
import { ChromiumDownloader, CHROMIUM_REVISION } from "./chromium-downloader";

/**
 * Get the platform-specific path to the Chromium executable.
 * This is needed because Playwright reads PLAYWRIGHT_BROWSERS_PATH at module
 * import time, not at launch time. By providing executablePath explicitly,
 * we ensure the correct browser is used regardless of when the env var was set.
 */
export function getChromiumExecutablePath(): string {
  const browsersPath = join(app.getPath("userData"), "playwright-browsers");
  const browserDir = join(browsersPath, `chromium-${CHROMIUM_REVISION}`);

  if (process.platform === "win32") {
    return join(browserDir, "chrome-win", "chrome.exe");
  } else if (process.platform === "darwin") {
    return join(browserDir, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium");
  }
  // Linux
  return join(browserDir, "chrome-linux", "chrome");
}

export class BrowserManager {
  private browsersPath: string;

  constructor() {
    // Store browsers in userData directory
    this.browsersPath = join(app.getPath("userData"), "playwright-browsers");
    process.env.PLAYWRIGHT_BROWSERS_PATH = this.browsersPath;
  }

  /**
   * Check if Chromium browser is installed
   */
  isBrowserInstalled(): boolean {

    // Simple check: does the browsers directory exist and have content?
    if (!existsSync(this.browsersPath)) {
      return false;
    }

    try {
      const files = readdirSync(this.browsersPath);
      const hasChromium = files.some((file: string) => file.startsWith("chromium-"));
      return hasChromium;
    } catch (error) {
      console.error("[BrowserManager] Error reading browsers directory:", error);
      return false;
    }
  }

  /**
   * Install Chromium browser with progress reporting
   * Uses direct HTTP download instead of npx (which isn't available in packaged apps)
   */
  async installBrowser(
    onProgress?: (progress: { percent: number; message: string }) => void
  ): Promise<void> {

    const downloader = new ChromiumDownloader({
      browsersPath: this.browsersPath,
      onProgress,
    });

    try {
      await downloader.download();
    } catch (error) {
      console.error("[BrowserManager] Browser installation failed:", error);
      throw new Error(
        `Failed to install browser: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the browsers path for Playwright configuration
   */
  getBrowsersPath(): string {
    return this.browsersPath;
  }
}
