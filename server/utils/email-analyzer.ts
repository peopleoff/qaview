import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { URL } from "node:url";
import { chromium } from "playwright";

import type { SpellCheckResult } from "./spell-checker";

import { checkSpelling } from "./spell-checker";

// Interface for analyzed links
type AnalyzedLink = {
  url: string;
  text: string;
  status?: number;
  redirectChain?: string[];
  finalUrl?: string;
  screenshotPath: string;
  utmParams?: Record<string, string>;
};

// Interface for analyzed images
type AnalyzedImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  status?: number;
};

// Email analysis result interface
export type EmailAnalysisResult = {
  links: AnalyzedLink[];
  images: AnalyzedImage[];
  spellCheck: SpellCheckResult;
  screenshots: {
    fullPage?: string;
  };
};

/**
 * Parse UTM parameters from a URL
 */
function parseUtmParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};

    // Extract all utm_* parameters
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (key.startsWith("utm_")) {
        params[key] = value;
      }
    }

    return params;
  }
  catch (error) {
    console.error(`Error parsing UTM params from URL ${url}:`, error);
    return {};
  }
}

/**
 * Analyzes the HTML content of an email using Playwright
 * @param emailId - ID of the email being analyzed
 * @param html - HTML content of the email
 * @returns Analysis result including links, images, spell check, and screenshots
 */
export async function analyzeEmailContent(emailId: number, html: string): Promise<EmailAnalysisResult> {
  // Create a browser instance
  const browser = await chromium.launch({ headless: false });

  try {
    // Create a new page
    const page = await browser.newPage();
    // create a unique folder name for the email ID and a human readable date
    const folderName = `email-${emailId}`;

    // Set content of the page to the email HTML
    await page.setContent(html, { waitUntil: "networkidle" });

    // Create directory for screenshots
    const screenshotsDir = join(process.cwd(), "/public/uploads/analysis", folderName);
    await mkdir(screenshotsDir, { recursive: true });

    // Take a screenshot of the full page
    const fullPageScreenshotPath = join(screenshotsDir, "full-page.png");
    await page.screenshot({ path: fullPageScreenshotPath, fullPage: true });

    const links = await page.$$eval("a", anchors => anchors.map((anchor) => {
      const url = anchor.getAttribute("href");
      const title = anchor.getAttribute("title");
      return { url, title };
    }));

    const images = await page.$$eval("img", images => images.map((image) => {
      const src = image.getAttribute("src");
      const alt = image.getAttribute("alt");
      const width = image.getAttribute("width");
      const height = image.getAttribute("height");

      // Parse width and height, handling NaN values
      const parsedWidth = width ? Number.parseInt(width) : undefined;
      const parsedHeight = height ? Number.parseInt(height) : undefined;

      return {
        src,
        alt,
        width: (parsedWidth && !Number.isNaN(parsedWidth)) ? parsedWidth : undefined,
        height: (parsedHeight && !Number.isNaN(parsedHeight)) ? parsedHeight : undefined,
      };
    }));

    // Check each link for redirects and status
    const analyzedLinks: AnalyzedLink[] = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      // Skip empty or javascript links
      if (!link.url || link.url.startsWith("javascript:") || link.url === "#") {
        continue;
      }

      try {
        // Create a new page for this link
        const linkPage = await browser.newPage();

        // Enable request interception to track status codes
        await linkPage.route("**", async (route) => {
          // Continue the request
          await route.continue();
        });

        // Initialize UTM params object to accumulate parameters from all redirects
        let accumulatedUtmParams: Record<string, string> = {};

        // Track redirects
        const redirectChain: string[] = [];
        linkPage.on("request", (request) => {
          const url = request.url();
          if (request.isNavigationRequest() && request.redirectedFrom()) {
            // Parse UTM params from this redirect URL and merge with accumulated params
            const currentUtmParams = parseUtmParams(url);
            accumulatedUtmParams = { ...accumulatedUtmParams, ...currentUtmParams };
            redirectChain.push(url);
          }
        });

        // Navigate to the link
        const response = await linkPage.goto(link.url, {
          waitUntil: "load",
          timeout: 1000000, // 10 second timeout
        }).catch(() => null); // Catch navigation errors

        const screenshotPath = join(screenshotsDir, `link-${i}.png`);

        await linkPage.screenshot({ path: screenshotPath }).catch(() => null);

        // Get status code
        const status = response ? response.status() : 0;
        const finalUrl = linkPage.url();

        // Parse UTM parameters from the final URL and merge with accumulated params
        const finalUtmParams = parseUtmParams(finalUrl);
        const allUtmParams = { ...accumulatedUtmParams, ...finalUtmParams };

        // Add to analyzed links
        analyzedLinks.push({
          url: link.url,
          text: link.title || "",
          status,
          redirectChain,
          finalUrl,
          screenshotPath: `link-${i}.png`,
          utmParams: allUtmParams,
        });

        // Close the link page
        await linkPage.close();
      }
      catch (error) {
        console.error(`Error analyzing link ${link.url}:`, error);
        analyzedLinks.push({
          url: link.url,
          text: link.title || "",
          screenshotPath: "",
          status: 0,
          redirectChain: [],
          finalUrl: link.url,
          utmParams: {},
        });
      }
    }

    // Check each image
    const analyzedImages: AnalyzedImage[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // Skip data URLs
      if (image.src.startsWith("data:")) {
        analyzedImages.push({
          ...image,
          status: 200,
        });
        continue;
      }

      try {
        // Create a new page for checking this image
        const imagePage = await browser.newPage();

        // Try to fetch the image
        const response = await imagePage.goto(image.src, {
          timeout: 5000, // 5 second timeout
        }).catch(() => null);

        // Get status code
        const status = response ? response.status() : 0;

        // Add to analyzed images
        analyzedImages.push({
          ...image,
          status,
        });

        // Close the image page
        await imagePage.close();
      }
      catch (error) {
        console.error(`Error analyzing image ${image.src}:`, error);
        analyzedImages.push({
          ...image,
          status: 0,
        });
      }
    }

    // Perform spell check on the email content
    const spellCheckResult = await checkSpelling(html);

    // Return the comprehensive analysis result
    return {
      links: analyzedLinks,
      images: analyzedImages,
      spellCheck: spellCheckResult,
      screenshots: {
        fullPage: `/uploads/analysis/${folderName}/full-page.png`,
      },
    };
  }
  finally {
    // Close the browser
    await browser.close();
  }
}
