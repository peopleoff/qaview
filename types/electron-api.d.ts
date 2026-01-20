/**
 * Type-safe Electron API declarations.
 * Replaces the old electron.d.ts with proper Drizzle schema type imports.
 */

import type {
  Email,
  NewEmail,
  Link,
  NewLink,
  Image,
  NewImage,
  QAChecklistItem,
  QANote,
  NewQANote,
  Attachment,
  SpellError,
} from "../lib/db/schema";
import type {
  IpcResponse,
  IpcVoidResponse,
  EmailUploadResponse,
  EmailAnalyzeResponse,
  PdfExportResponse,
  BrowserInstallResponse,
} from "./ipc";
import type {
  AnalysisProgress,
  BrowserInstallProgress,
  UtmCampaignsData,
} from "./progress";

/** Extended attachment type with base64 data URL for renderer display */
export interface AttachmentWithData extends Attachment {
  dataUrl?: string;
}

declare global {
  interface Window {
    electronAPI: {
      // ==================== Browser Management ====================
      /** Check if Chromium browser is installed */
      isBrowserInstalled: () => Promise<IpcResponse<boolean>>;

      /** Install Chromium browser with progress updates */
      installBrowser: () => Promise<BrowserInstallResponse>;

      /** Subscribe to browser install progress events */
      onBrowserInstallProgress: (
        callback: (progress: BrowserInstallProgress) => void
      ) => void;

      // ==================== Analysis Progress ====================
      /** Subscribe to email analysis progress events */
      onAnalysisProgress: (
        callback: (progress: AnalysisProgress) => void
      ) => void;

      /** Remove all analysis progress listeners */
      removeAnalysisProgressListener: () => void;

      // ==================== Email Operations ====================
      /** Get all emails ordered by creation date (newest first) */
      getEmails: () => Promise<IpcResponse<Email[]>>;

      /** Get a single email by ID with all relations */
      getEmail: (id: number) => Promise<IpcResponse<Email | undefined>>;

      /** Create a new email record */
      createEmail: (data: NewEmail) => Promise<IpcResponse<Email>>;

      /** Update an existing email */
      updateEmail: (
        id: number,
        data: Partial<Email>
      ) => Promise<IpcResponse<Email>>;

      /** Delete an email and its associated files */
      deleteEmail: (id: number) => Promise<IpcVoidResponse>;

      // ==================== Link Operations ====================
      /** Get all links for an email */
      getLinks: (emailId: number) => Promise<IpcResponse<Link[]>>;

      /** Update a link record */
      updateLink: (
        id: number,
        data: Partial<Link>
      ) => Promise<IpcResponse<Link>>;

      /** Create multiple link records */
      createLinks: (links: NewLink[]) => Promise<IpcResponse<Link[]>>;

      // ==================== Image Operations ====================
      /** Get all images for an email */
      getImages: (emailId: number) => Promise<IpcResponse<Image[]>>;

      /** Update an image record */
      updateImage: (
        id: number,
        data: Partial<Image>
      ) => Promise<IpcResponse<Image>>;

      /** Create multiple image records */
      createImages: (images: NewImage[]) => Promise<IpcResponse<Image[]>>;

      // ==================== QA Checklist Operations ====================
      /** Get QA checklist items for an email */
      getQAChecklist: (
        emailId: number
      ) => Promise<IpcResponse<QAChecklistItem[]>>;

      /** Update a QA checklist item */
      updateQAChecklistItem: (
        id: number,
        data: Partial<QAChecklistItem>
      ) => Promise<IpcResponse<QAChecklistItem>>;

      // ==================== QA Notes Operations ====================
      /** Get QA notes for an email */
      getQANotes: (emailId: number) => Promise<IpcResponse<QANote[]>>;

      /** Create a new QA note */
      createQANote: (data: NewQANote) => Promise<IpcResponse<QANote>>;

      /** Delete a QA note */
      deleteQANote: (id: number) => Promise<IpcVoidResponse>;

      // ==================== Attachments Operations ====================
      /** Get attachments for an email with base64 data URLs */
      getAttachments: (
        emailId: number
      ) => Promise<IpcResponse<AttachmentWithData[]>>;

      /** Open file dialog to select attachment files */
      selectAttachments: () => Promise<IpcResponse<string[]>>;

      /** Create attachments from file paths */
      createAttachments: (
        emailId: number,
        filePaths: string[],
        description?: string,
        type?: string
      ) => Promise<IpcResponse<Attachment[]>>;

      /** Delete an attachment and its file */
      deleteAttachment: (id: number) => Promise<IpcVoidResponse>;

      // ==================== Spell Error Operations ====================
      /** Get spell errors for an email */
      getSpellErrors: (emailId: number) => Promise<IpcResponse<SpellError[]>>;

      /** Delete a spell error record */
      deleteSpellError: (id: number) => Promise<IpcVoidResponse>;

      // ==================== File Operations ====================
      /** Open file dialog to select an email file */
      selectFile: () => Promise<IpcResponse<string | null>>;

      /** Upload an email file and create database record */
      uploadEmail: (filePath: string) => Promise<EmailUploadResponse>;

      /** Analyze an email with Playwright */
      analyzeEmail: (emailId: number) => Promise<EmailAnalyzeResponse>;

      /** Get image data as base64 data URL */
      getImageData: (filePath: string) => Promise<IpcResponse<string>>;

      /** Get UTM campaign data from email links */
      getUtmCampaigns: (
        emailId: number
      ) => Promise<IpcResponse<UtmCampaignsData>>;

      /** Set the emailId field from UTM campaign */
      setEmailId: (
        id: number,
        emailId: string
      ) => Promise<IpcResponse<Email>>;

      // ==================== PDF Export ====================
      /** Get HTML preview for PDF export */
      getPreviewHtml: (emailId: string) => Promise<IpcResponse<string>>;

      /** Export email analysis as PDF */
      exportPdf: (emailId: string) => Promise<PdfExportResponse>;
    };
  }
}

export {};
