import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { app } from "electron";
import { ChromiumDownloader } from "./chromium-downloader";

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
    console.log("[BrowserManager] Checking browser installation...");
    console.log("[BrowserManager] Browsers path:", this.browsersPath);

    // Simple check: does the browsers directory exist and have content?
    if (!existsSync(this.browsersPath)) {
      console.log("[BrowserManager] Browsers directory does not exist");
      return false;
    }

    try {
      const files = readdirSync(this.browsersPath);
      console.log("[BrowserManager] Directory contents:", files);
      const hasChromium = files.some((file: string) => file.startsWith("chromium-"));
      console.log("[BrowserManager] Chromium found:", hasChromium);
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
    console.log("[BrowserManager] Starting browser installation...");
    console.log("[BrowserManager] Browsers path:", this.browsersPath);

    const downloader = new ChromiumDownloader({
      browsersPath: this.browsersPath,
      onProgress,
    });

    try {
      await downloader.download();
      console.log("[BrowserManager] Browser installation complete");
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
