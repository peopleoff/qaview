import { mkdir } from "fs/promises";
import { join } from "path";
import { app } from "electron";

/**
 * Screenshot manager utility for organizing email analysis screenshots
 */

export class ScreenshotManager {
  private baseDir: string;

  constructor() {
    // Store screenshots in userData/screenshots
    this.baseDir = join(app.getPath("userData"), "screenshots");
  }

  /**
   * Create a timestamped directory for an email's screenshots
   */
  async createEmailScreenshotDir(emailId: number): Promise<string> {
    const timestamp = new Date().getTime();
    const emailDir = join(this.baseDir, `email-${emailId}-${timestamp}`);
    await mkdir(emailDir, { recursive: true });
    return emailDir;
  }

  /**
   * Generate screenshot paths for desktop and mobile views
   */
  getScreenshotPaths(emailDir: string) {
    return {
      desktop: join(emailDir, "desktop.png"),
      mobile: join(emailDir, "mobile.png"),
    };
  }

  /**
   * Generate screenshot path for a specific link
   */
  getLinkScreenshotPath(emailDir: string, linkIndex: number): string {
    return join(emailDir, `link-${linkIndex}.png`);
  }

  /**
   * Get the base screenshots directory
   */
  getBaseDir(): string {
    return this.baseDir;
  }
}
