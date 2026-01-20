/**
 * Email analysis type definitions
 * Based on the database schema and original analyzer structure
 */

export interface AnalyzedLink {
  text: string | null;
  url: string;
  status: number | null;
  redirectChain: string[] | null;
  finalUrl: string | null;
  utmParams: Record<string, string> | null;
  screenshotPath: string | null;
}

export interface AnalyzedImage {
  src: string;
  alt: string | null;
  status: number | null;
  width: number | null;
  height: number | null;
}

export interface EmailAnalysisResult {
  links: AnalyzedLink[];
  images: AnalyzedImage[];
  screenshotDesktopUrl: string;
  screenshotMobileUrl: string;
  subject: string | null;
  emailId: string | null;
}

export interface UtmParams {
  [key: string]: string;
}
