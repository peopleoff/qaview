import { chromium, Browser, BrowserContextOptions } from "playwright";
import {
  AnalyzedLink,
  AnalyzedImage,
  EmailAnalysisResult,
  UtmParams,
} from "../types/email-analysis";
import { ScreenshotManager } from "./screenshot-manager";
import { getChromiumExecutablePath } from "./browser-manager";

/**
 * Browser context options that make the browser appear more like a real user
 * This helps avoid "Access Denied" errors from bot detection systems
 */
const STEALTH_CONTEXT_OPTIONS: BrowserContextOptions = {
  // Use a realistic Chrome user agent
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Set realistic viewport
  viewport: { width: 1040, height: 632 },

  // Set screen size to match viewport
  screen: { width: 1040, height: 632 },

  // Set locale and timezone
  locale: 'en-US',
  timezoneId: 'America/New_York',

  // Add common browser headers
  extraHTTPHeaders: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  },

  // Bypass CSP to avoid some blocking
  bypassCSP: true,

  // Ignore HTTPS errors (some redirects may have cert issues)
  ignoreHTTPSErrors: true,
};

/**
 * Analyze a single link by navigating to it and capturing data
 * @param url - The URL to analyze
 * @param emailId - The email ID for screenshot organization
 * @param linkIndex - The index of the link (for screenshot naming)
 * @returns Analyzed link data
 */
export async function analyzeSingleLink(
  url: string,
  emailId: number,
  linkIndex: number
): Promise<AnalyzedLink> {
  const screenshotManager = new ScreenshotManager();
  const emailDir = await screenshotManager.createEmailScreenshotDir(emailId);

  let browser: Browser | null = null;

  const analyzedLink: AnalyzedLink = {
    text: null, // Text is preserved from existing link
    url,
    status: null,
    redirectChain: null,
    finalUrl: null,
    utmParams: null,
    screenshotPath: null,
  };

  // Skip data URLs and mailto links
  if (url.startsWith("data:") || url.startsWith("mailto:")) {
    return analyzedLink;
  }

  try {
    // Launch browser (visible to user so they can see link being visited)
    browser = await chromium.launch({
      headless: false,
      executablePath: getChromiumExecutablePath(),
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
      ],
    });
    const context = await browser.newContext(STEALTH_CONTEXT_OPTIONS);

    // Add stealth scripts to evade bot detection
    await context.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // Mock plugins array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: 'denied' } as PermissionStatus)
          : originalQuery(parameters);

      // Mock chrome runtime
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
      };
    });

    const linkPage = await context.newPage();

    const redirectChain: string[] = [];
    let allUtmParams: UtmParams = {};

    // Track redirects using request event (more reliable)
    linkPage.on("request", (request) => {
      const requestUrl = request.url();
      if (request.isNavigationRequest() && request.redirectedFrom()) {
        redirectChain.push(requestUrl);
        // Accumulate UTM params from redirect chain
        const params = parseUtmParams(requestUrl);
        allUtmParams = { ...allUtmParams, ...params };
      }
    });

    const response = await linkPage.goto(url, {
      waitUntil: "load",
      timeout: 15000,
    }).catch(() => null);

    // Wait for dynamic content to load (important for social media sites)
    await linkPage.waitForTimeout(5000);

    // Ensure DOM is ready
    await linkPage.waitForLoadState("domcontentloaded").catch(() => {});

    const finalUrl = linkPage.url();
    redirectChain.push(finalUrl);

    // Get final UTM params
    const finalUtmParams = parseUtmParams(finalUrl);
    allUtmParams = { ...allUtmParams, ...finalUtmParams };

    // Get initial UTM params from original URL
    const initialUtmParams = parseUtmParams(url);
    allUtmParams = { ...initialUtmParams, ...allUtmParams };

    analyzedLink.status = response?.status() || null;
    analyzedLink.redirectChain = redirectChain.length > 0 ? redirectChain : null;
    analyzedLink.finalUrl = finalUrl !== url ? finalUrl : null;
    analyzedLink.utmParams = Object.keys(allUtmParams).length > 0 ? allUtmParams : null;

    // Take screenshot of destination with timeout
    const screenshotPath = screenshotManager.getLinkScreenshotPath(emailDir, linkIndex);
    await linkPage.screenshot({
      path: screenshotPath,
      fullPage: true,
      timeout: 10000
    });
    analyzedLink.screenshotPath = screenshotPath;

    await linkPage.close();
    await context.close();
  } catch (error) {
    console.error(`Failed to analyze link ${url}:`, error);
    // Provide fallback data for failed analysis
    analyzedLink.status = 0;
    analyzedLink.redirectChain = [];
    analyzedLink.finalUrl = url;
    analyzedLink.utmParams = {};
    analyzedLink.screenshotPath = "";
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return analyzedLink;
}

/**
 * Patterns for identifying tracking pixels by URL
 */
const TRACKING_PIXEL_PATTERNS = {
  // Known tracking pixel domains
  domains: [
    'beacon.krxd.net',
  ],
  // URL path patterns that indicate tracking
  paths: [
    '/open.aspx',    // SFMC open tracking
    '/1x1_',         // Explicit 1x1 tracking pixels
  ],
};

/**
 * Check if a URL is a known tracking pixel
 */
function isTrackingPixel(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Check domain blocklist
    if (TRACKING_PIXEL_PATTERNS.domains.some(d => parsed.hostname.includes(d))) {
      return true;
    }

    // Check path patterns
    if (TRACKING_PIXEL_PATTERNS.paths.some(p => parsed.pathname.toLowerCase().includes(p.toLowerCase()))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Parse UTM parameters from a URL
 * Handles both standard query params and params embedded in hash fragments
 * (e.g., https://example.com/#/path?utm_source=test)
 */
function parseUtmParams(url: string): UtmParams {
  try {
    const urlObj = new URL(url);
    const params: UtmParams = {};

    // Parse standard query parameters
    urlObj.searchParams.forEach((value, key) => {
      if (key.startsWith("utm_")) {
        params[key] = value;
      }
    });

    // Also check for query params embedded in hash fragment
    // Some URLs use hash-based routing with params: example.com/#/path?utm_source=test
    if (urlObj.hash && urlObj.hash.includes("?")) {
      const hashQueryString = urlObj.hash.split("?")[1];
      if (hashQueryString) {
        const hashParams = new URLSearchParams(hashQueryString);
        hashParams.forEach((value, key) => {
          if (key.startsWith("utm_")) {
            params[key] = value;
          }
        });
      }
    }

    return params;
  } catch {
    return {};
  }
}

/**
 * Progress callback type for analysis stages
 */
export type AnalysisProgressCallback = (progress: {
  stage: 'parsing' | 'screenshots' | 'links' | 'images' | 'complete';
  message: string;
  current?: number;
  total?: number;
}) => void;

/**
 * Analyze email content with Playwright
 */
export async function analyzeEmailContent(
  emailId: number,
  htmlContent: string,
  onProgress?: AnalysisProgressCallback
): Promise<EmailAnalysisResult> {
  const screenshotManager = new ScreenshotManager();
  const emailDir = await screenshotManager.createEmailScreenshotDir(emailId);
  const { desktop: desktopPath, mobile: mobilePath } =
    screenshotManager.getScreenshotPaths(emailDir);

  let browser: Browser | null = null;

  try {
    onProgress?.({ stage: 'parsing', message: 'Loading email content...' });

    // Launch browser (visible to user so they can see links being clicked)
    browser = await chromium.launch({
      headless: false,
      executablePath: getChromiumExecutablePath(),
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
      ],
    });
    const context = await browser.newContext(STEALTH_CONTEXT_OPTIONS);

    // Add stealth scripts to evade bot detection
    await context.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // Mock plugins array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: 'denied' } as PermissionStatus)
          : originalQuery(parameters);

      // Mock chrome runtime
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
      };
    });

    const page = await context.newPage();

    // Load email HTML
    await page.setContent(htmlContent, { waitUntil: "networkidle" });

    onProgress?.({ stage: 'screenshots', message: 'Taking screenshots...' });

    // Take desktop screenshot (800px width)
    await page.setViewportSize({ width: 800, height: 600 });
    await page.screenshot({ path: desktopPath, fullPage: true });

    // Take mobile screenshot (375px width)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: mobilePath, fullPage: true });

    // Extract all links with proper text/title extraction
    const linkElements = await page.$$eval("a", (anchors) =>
      anchors.map((anchor) => {
        const url = anchor.getAttribute("href");
        const title = anchor.getAttribute("title");
        return { url, title };
      })
    );
    const links: AnalyzedLink[] = [];
    const totalLinks = linkElements.filter(l => l.url && !l.url.startsWith("data:") && !l.url.startsWith("mailto:")).length;

    for (let i = 0; i < linkElements.length; i++) {
      const link = linkElements[i];
      const href = link.url;

      if (!href) continue;

      // Report progress for non-skipped links
      if (!href.startsWith("data:") && !href.startsWith("mailto:")) {
        const currentLinkIndex = links.filter(l => l.status !== null).length + 1;
        onProgress?.({
          stage: 'links',
          message: `Checking link ${currentLinkIndex} of ${totalLinks}`,
          current: currentLinkIndex,
          total: totalLinks
        });

        // Add random delay between link checks to appear more human-like (500ms-1500ms)
        if (currentLinkIndex > 1) {
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        }
      }

      const analyzedLink: AnalyzedLink = {
        text: link.title || "",
        url: href,
        status: null,
        redirectChain: null,
        finalUrl: null,
        utmParams: null,
        screenshotPath: null,
      };

      // Skip data URLs and mailto links
      if (href.startsWith("data:") || href.startsWith("mailto:")) {
        links.push(analyzedLink);
        continue;
      }

      // Analyze link by navigating to it
      try {
        const linkPage = await context.newPage();
        const redirectChain: string[] = [];
        let allUtmParams: UtmParams = {};

        // Track redirects using request event (more reliable)
        linkPage.on("request", (request) => {
          const url = request.url();
          if (request.isNavigationRequest() && request.redirectedFrom()) {
            redirectChain.push(url);
            // Accumulate UTM params from redirect chain
            const params = parseUtmParams(url);
            allUtmParams = { ...allUtmParams, ...params };
          }
        });

        const response = await linkPage.goto(href, {
          waitUntil: "load",
          timeout: 15000,
        }).catch(() => null);

        // Wait for dynamic content to load (important for social media sites)
        await linkPage.waitForTimeout(5000);

        // Ensure DOM is ready
        await linkPage.waitForLoadState("domcontentloaded").catch(() => {});

        const finalUrl = linkPage.url();
        redirectChain.push(finalUrl);

        // Get final UTM params
        const finalUtmParams = parseUtmParams(finalUrl);
        allUtmParams = { ...allUtmParams, ...finalUtmParams };

        // Get initial UTM params from original URL
        const initialUtmParams = parseUtmParams(href);
        allUtmParams = { ...initialUtmParams, ...allUtmParams };

        analyzedLink.status = response?.status() || null;
        analyzedLink.redirectChain =
          redirectChain.length > 0 ? redirectChain : null;
        analyzedLink.finalUrl = finalUrl !== href ? finalUrl : null;
        analyzedLink.utmParams =
          Object.keys(allUtmParams).length > 0 ? allUtmParams : null;

        // Take screenshot of destination with timeout
        const screenshotPath = screenshotManager.getLinkScreenshotPath(
          emailDir,
          i
        );
        await linkPage.screenshot({
          path: screenshotPath,
          fullPage: true,
          timeout: 10000
        });
        analyzedLink.screenshotPath = screenshotPath;

        await linkPage.close();
      } catch (error) {
        console.error(`Failed to analyze link ${href}:`, error);
        // Provide fallback data for failed analysis
        analyzedLink.status = 0;
        analyzedLink.redirectChain = [];
        analyzedLink.finalUrl = href;
        analyzedLink.utmParams = {};
        analyzedLink.screenshotPath = "";
      }

      links.push(analyzedLink);
    }

    // Extract all images
    const imageElements = await page.$$("img");
    const images: AnalyzedImage[] = [];

    for (const element of imageElements) {
      const src = await element.getAttribute("src");
      const alt = await element.getAttribute("alt");
      const width = await element.getAttribute("width");
      const height = await element.getAttribute("height");


      if (!src) continue;

      // Filter out tracking pixels (1x1 images)
      const widthNum = width ? parseInt(width) : null;
      const heightNum = height ? parseInt(height) : null;

      if (
        (widthNum === 1 && heightNum === 1) ||
        (widthNum === 1 && !heightNum) ||
        (!widthNum && heightNum === 1)
      ) {
        continue; // Skip tracking pixels
      }

      // Filter out URL-based tracking pixels (SFMC, Krux, etc.)
      if (isTrackingPixel(src)) {
        continue;
      }

      const analyzedImage: AnalyzedImage = {
        src,
        alt: alt || null,
        status: null,
        width: widthNum,
        height: heightNum,
      };

      images.push(analyzedImage);
    }

    await context.close();

    // Validate images with separate headless browser
    onProgress?.({ stage: 'images', message: 'Validating images...', current: 0, total: images.length });
    const imageBrowser = await chromium.launch({
      headless: true,
      executablePath: getChromiumExecutablePath(),
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    });

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        onProgress?.({
          stage: 'images',
          message: `Checking image ${i + 1} of ${images.length}`,
          current: i + 1,
          total: images.length
        });

        // Handle data URLs with default status
        if (image.src.startsWith("data:")) {
          image.status = 200;
          continue;
        }

        try {
          const imagePage = await imageBrowser.newPage();
          const response = await imagePage.goto(image.src, { timeout: 5000 }).catch(() => null);
          image.status = response?.status() || 0;
          await imagePage.close();
        } catch (error) {
          console.error(`Failed to validate image ${image.src}:`, error);
          image.status = 0;
        }
      }
    } finally {
      await imageBrowser.close();
    }

    onProgress?.({ stage: 'complete', message: 'Analysis complete!' });

    return {
      links,
      images,
      screenshotDesktopUrl: desktopPath,
      screenshotMobileUrl: mobilePath,
      subject: null, // Will be set by the caller from mailparser
      emailId: null, // Will be extracted from UTM campaigns
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
