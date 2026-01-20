/**
 * Progress event types for long-running operations.
 */

/** Analysis progress event sent during email analysis */
export interface AnalysisProgress {
  stage: "parsing" | "screenshots" | "links" | "images" | "complete";
  message: string;
  current?: number;
  total?: number;
}

/** Browser install progress event sent during Chromium download */
export interface BrowserInstallProgress {
  percent: number;
  message: string;
}

/** UTM campaigns data returned from email analysis */
export interface UtmCampaignsData {
  availableCampaigns: string[];
  hasMultipleCampaigns: boolean;
  hasNoCampaigns: boolean;
}
