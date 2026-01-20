import { createWriteStream, existsSync, mkdirSync, chmodSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { get as httpsGet } from "https";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";
import { unlink, readdir } from "fs/promises";
import { createGunzip } from "zlib";
import type { IncomingMessage } from "http";

// Use yauzl for cross-platform zip extraction
import * as yauzl from "yauzl";

export interface DownloadProgress {
  percent: number;
  message: string;
  downloadedMB?: number;
  totalMB?: number;
}

interface ChromiumDownloaderOptions {
  browsersPath: string;
  onProgress?: (progress: DownloadProgress) => void;
}

// Chromium revision from Playwright browsers.json
const CHROMIUM_REVISION = "1194";

// CDN URL patterns from Playwright source
const CDN_BASE_URL = "https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium";

export class ChromiumDownloader {
  private browsersPath: string;
  private onProgress: (progress: DownloadProgress) => void;

  constructor(options: ChromiumDownloaderOptions) {
    this.browsersPath = options.browsersPath;
    this.onProgress = options.onProgress || (() => {});
  }

  /**
   * Get the download URL for the current platform
   */
  private getDownloadUrl(): string {
    const platform = process.platform;
    const arch = process.arch;

    let platformSuffix: string;

    if (platform === "darwin") {
      // macOS
      platformSuffix = arch === "arm64" ? "chromium-mac-arm64.zip" : "chromium-mac.zip";
    } else if (platform === "win32") {
      // Windows
      platformSuffix = arch === "x64" ? "chromium-win64.zip" : "chromium-win32.zip";
    } else {
      // Linux
      platformSuffix = "chromium-linux.zip";
    }

    return `${CDN_BASE_URL}/${CHROMIUM_REVISION}/${platformSuffix}`;
  }

  /**
   * Get the expected browser directory name
   */
  private getBrowserDirName(): string {
    return `chromium-${CHROMIUM_REVISION}`;
  }

  /**
   * Download a file with progress reporting
   */
  private downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("[ChromiumDownloader] Downloading from:", url);
      this.onProgress({ percent: 0, message: "Starting download..." });

      const makeRequest = (requestUrl: string, redirectCount = 0) => {
        if (redirectCount > 5) {
          reject(new Error("Too many redirects"));
          return;
        }

        httpsGet(requestUrl, (response: IncomingMessage) => {
          // Handle redirects
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            console.log("[ChromiumDownloader] Following redirect to:", response.headers.location);
            makeRequest(response.headers.location, redirectCount + 1);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Download failed with status ${response.statusCode}`));
            return;
          }

          const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
          const totalMB = totalBytes / (1024 * 1024);
          let downloadedBytes = 0;

          // Ensure directory exists
          const destDir = dirname(destPath);
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }

          const fileStream = createWriteStream(destPath);

          response.on("data", (chunk: Buffer) => {
            downloadedBytes += chunk.length;
            const downloadedMB = downloadedBytes / (1024 * 1024);
            const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 70) : 0; // 0-70% for download

            this.onProgress({
              percent,
              message: `Downloading Chromium... ${downloadedMB.toFixed(1)}MB / ${totalMB.toFixed(1)}MB`,
              downloadedMB,
              totalMB,
            });
          });

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            console.log("[ChromiumDownloader] Download complete:", destPath);
            resolve();
          });

          fileStream.on("error", (err) => {
            fileStream.close();
            reject(err);
          });
        }).on("error", reject);
      };

      makeRequest(url);
    });
  }

  /**
   * Extract a zip file using yauzl
   */
  private extractZip(zipPath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("[ChromiumDownloader] Extracting to:", destPath);
      this.onProgress({ percent: 70, message: "Extracting browser files..." });

      // Ensure destination exists
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true });
      }

      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }
        if (!zipfile) {
          reject(new Error("Failed to open zip file"));
          return;
        }

        const totalEntries = zipfile.entryCount;
        let extractedEntries = 0;

        zipfile.readEntry();

        zipfile.on("entry", (entry) => {
          extractedEntries++;
          const percent = 70 + Math.round((extractedEntries / totalEntries) * 25); // 70-95% for extraction

          if (extractedEntries % 100 === 0) {
            this.onProgress({
              percent,
              message: `Extracting files... ${extractedEntries}/${totalEntries}`,
            });
          }

          const fullPath = join(destPath, entry.fileName);

          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            if (!existsSync(fullPath)) {
              mkdirSync(fullPath, { recursive: true });
            }
            zipfile.readEntry();
          } else {
            // File entry
            const dirPath = dirname(fullPath);
            if (!existsSync(dirPath)) {
              mkdirSync(dirPath, { recursive: true });
            }

            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }
              if (!readStream) {
                reject(new Error("Failed to open read stream"));
                return;
              }

              const writeStream = createWriteStream(fullPath);
              readStream.pipe(writeStream);

              writeStream.on("close", () => {
                zipfile.readEntry();
              });

              writeStream.on("error", reject);
            });
          }
        });

        zipfile.on("end", () => {
          console.log("[ChromiumDownloader] Extraction complete");
          resolve();
        });

        zipfile.on("error", reject);
      });
    });
  }

  /**
   * Set executable permissions on macOS/Linux
   */
  private async setExecutablePermissions(): Promise<void> {
    if (process.platform === "win32") {
      return; // Windows doesn't need this
    }

    this.onProgress({ percent: 95, message: "Setting permissions..." });

    const browserDir = join(this.browsersPath, this.getBrowserDirName());

    // Find the Chromium executable
    const executablePaths: string[] = [];

    if (process.platform === "darwin") {
      // macOS: Chromium.app/Contents/MacOS/Chromium
      executablePaths.push(
        join(browserDir, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"),
        // Fallback paths in case structure differs
        join(browserDir, "Chromium.app", "Contents", "MacOS", "Chromium")
      );
    } else {
      // Linux
      executablePaths.push(
        join(browserDir, "chrome-linux", "chrome"),
        join(browserDir, "chrome")
      );
    }

    for (const execPath of executablePaths) {
      if (existsSync(execPath)) {
        try {
          chmodSync(execPath, 0o755);
          console.log("[ChromiumDownloader] Set executable permission:", execPath);
        } catch (err) {
          console.error("[ChromiumDownloader] Failed to set permission:", execPath, err);
        }
      }
    }

    // Also set executable permission on helper apps for macOS
    if (process.platform === "darwin") {
      const chromeMacPath = join(browserDir, "chrome-mac");
      if (existsSync(chromeMacPath)) {
        try {
          await this.setExecutableRecursive(chromeMacPath);
        } catch (err) {
          console.error("[ChromiumDownloader] Failed to set recursive permissions:", err);
        }
      }
    }
  }

  /**
   * Recursively set executable permissions for macOS app bundles
   */
  private async setExecutableRecursive(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await this.setExecutableRecursive(fullPath);
      } else if (entry.name.endsWith(".dylib") ||
                 entry.name === "Chromium" ||
                 entry.name.startsWith("Chromium ") ||
                 !entry.name.includes(".")) {
        // Set executable for binaries and dylibs
        try {
          chmodSync(fullPath, 0o755);
        } catch {
          // Ignore errors for files we can't chmod
        }
      }
    }
  }

  /**
   * Write a marker file to indicate successful installation
   */
  private writeMarkerFile(): void {
    const markerPath = join(this.browsersPath, this.getBrowserDirName(), ".installed");
    writeFileSync(markerPath, new Date().toISOString());
    console.log("[ChromiumDownloader] Wrote marker file:", markerPath);
  }

  /**
   * Main download and installation method
   */
  async download(): Promise<void> {
    try {
      // 1. Ensure browsers directory exists
      if (!existsSync(this.browsersPath)) {
        mkdirSync(this.browsersPath, { recursive: true });
      }

      // 2. Get download URL for platform
      const downloadUrl = this.getDownloadUrl();
      const tempZipPath = join(this.browsersPath, "chromium-download.zip");

      // 3. Download the browser
      await this.downloadFile(downloadUrl, tempZipPath);

      // 4. Extract the zip
      const browserDirPath = join(this.browsersPath, this.getBrowserDirName());
      if (!existsSync(browserDirPath)) {
        mkdirSync(browserDirPath, { recursive: true });
      }
      await this.extractZip(tempZipPath, browserDirPath);

      // 5. Set executable permissions
      await this.setExecutablePermissions();

      // 6. Write marker file
      this.writeMarkerFile();

      // 7. Clean up temp zip
      try {
        await unlink(tempZipPath);
        console.log("[ChromiumDownloader] Cleaned up temp file");
      } catch {
        console.warn("[ChromiumDownloader] Failed to clean up temp file");
      }

      this.onProgress({ percent: 100, message: "Installation complete!" });
      console.log("[ChromiumDownloader] Chromium installation complete");

    } catch (error) {
      console.error("[ChromiumDownloader] Installation failed:", error);
      throw error;
    }
  }
}
