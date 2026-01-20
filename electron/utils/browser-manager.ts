import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";
import { app } from "electron";

const execFileAsync = promisify(execFile);

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
    // Check if chromium directory exists in the browsers path
    const chromiumPath = join(this.browsersPath, "chromium-*");

    // Simple check: does the browsers directory exist and have content?
    if (!existsSync(this.browsersPath)) {
      return false;
    }

    try {
      const fs = require("fs");
      const files = fs.readdirSync(this.browsersPath);
      return files.some((file: string) => file.startsWith("chromium-"));
    } catch {
      return false;
    }
  }

  /**
   * Install Chromium browser with progress reporting
   */
  async installBrowser(
    onProgress?: (progress: { percent: number; message: string }) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const npxPath = process.platform === "win32" ? "npx.cmd" : "npx";

      const child = execFile(
        npxPath,
        ["playwright", "install", "chromium", "--with-deps"],
        {
          env: {
            ...process.env,
            PLAYWRIGHT_BROWSERS_PATH: this.browsersPath,
          },
        }
      );

      let output = "";

      child.stdout?.on("data", (data) => {
        output += data.toString();
        const lines = output.split("\n");
        const lastLine = lines[lines.length - 2] || lines[lines.length - 1];

        // Parse progress from output
        if (lastLine.includes("Downloading")) {
          const match = lastLine.match(/(\d+)%/);
          if (match) {
            const percent = parseInt(match[1]);
            onProgress?.({
              percent,
              message: "Downloading Chromium browser...",
            });
          }
        } else if (lastLine.includes("Installing")) {
          onProgress?.({
            percent: 95,
            message: "Installing browser dependencies...",
          });
        }
      });

      child.stderr?.on("data", (data) => {
        console.error("Browser install stderr:", data.toString());
      });

      child.on("error", (error) => {
        reject(new Error(`Failed to install browser: ${error.message}`));
      });

      child.on("close", (code) => {
        if (code === 0) {
          onProgress?.({ percent: 100, message: "Installation complete!" });
          resolve();
        } else {
          reject(new Error(`Browser installation failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Get the browsers path for Playwright configuration
   */
  getBrowsersPath(): string {
    return this.browsersPath;
  }
}
