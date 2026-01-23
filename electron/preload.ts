import { contextBridge, ipcRenderer } from "electron";
import type {
  NewEmail,
  NewLink,
  NewImage,
  NewQANote,
  Email,
  Link,
  Image,
  QAChecklistItem,
} from "../lib/db/schema";
import type { AnalysisProgress, BrowserInstallProgress } from "../types/progress";

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Browser management
  isBrowserInstalled: () => ipcRenderer.invoke("browser:isInstalled"),
  installBrowser: () => ipcRenderer.invoke("browser:install"),
  onBrowserInstallProgress: (callback: (progress: BrowserInstallProgress) => void) => {
    ipcRenderer.on("browser:installProgress", (_event, progress) => callback(progress));
  },
  onAnalysisProgress: (callback: (progress: AnalysisProgress) => void) => {
    ipcRenderer.on("email:analysisProgress", (_event, progress) => callback(progress));
  },
  removeAnalysisProgressListener: () => {
    ipcRenderer.removeAllListeners("email:analysisProgress");
  },

  // Email operations
  getEmails: () => ipcRenderer.invoke("db:getEmails"),
  getEmail: (id: number) => ipcRenderer.invoke("db:getEmail", id),
  createEmail: (data: NewEmail) => ipcRenderer.invoke("db:createEmail", data),
  updateEmail: (id: number, data: Partial<Email>) =>
    ipcRenderer.invoke("db:updateEmail", id, data),
  deleteEmail: (id: number) => ipcRenderer.invoke("db:deleteEmail", id),

  // Link operations
  getLinks: (emailId: number) => ipcRenderer.invoke("db:getLinks", emailId),
  updateLink: (id: number, data: Partial<Link>) =>
    ipcRenderer.invoke("db:updateLink", id, data),
  createLinks: (links: NewLink[]) => ipcRenderer.invoke("db:createLinks", links),
  reanalyzeLink: (linkId: number, emailId: number) =>
    ipcRenderer.invoke("link:reanalyze", linkId, emailId),

  // Image operations
  getImages: (emailId: number) => ipcRenderer.invoke("db:getImages", emailId),
  updateImage: (id: number, data: Partial<Image>) =>
    ipcRenderer.invoke("db:updateImage", id, data),
  createImages: (images: NewImage[]) => ipcRenderer.invoke("db:createImages", images),

  // QA Checklist operations
  getQAChecklist: (emailId: number) =>
    ipcRenderer.invoke("db:getQAChecklist", emailId),
  updateQAChecklistItem: (id: number, data: Partial<QAChecklistItem>) =>
    ipcRenderer.invoke("db:updateQAChecklistItem", id, data),

  // QA Notes operations
  getQANotes: (emailId: number) => ipcRenderer.invoke("db:getQANotes", emailId),
  createQANote: (data: NewQANote) => ipcRenderer.invoke("db:createQANote", data),
  deleteQANote: (id: number) => ipcRenderer.invoke("db:deleteQANote", id),

  // Attachments operations
  getAttachments: (emailId: number) => ipcRenderer.invoke("db:getAttachments", emailId),
  selectAttachments: () => ipcRenderer.invoke("file:selectAttachments"),
  createAttachments: (emailId: number, filePaths: string[], description?: string, type?: string) =>
    ipcRenderer.invoke("db:createAttachments", emailId, filePaths, description, type),
  deleteAttachment: (id: number) => ipcRenderer.invoke("db:deleteAttachment", id),

  // Spell Errors operations
  getSpellErrors: (emailId: number) =>
    ipcRenderer.invoke("db:getSpellErrors", emailId),
  deleteSpellError: (id: number) =>
    ipcRenderer.invoke("db:deleteSpellError", id),

  // File operations
  selectFile: () => ipcRenderer.invoke("file:select"),
  uploadEmail: (filePath: string) => ipcRenderer.invoke("email:upload", filePath),
  analyzeEmail: (emailId: number) => ipcRenderer.invoke("email:analyze", emailId),
  getImageData: (filePath: string) => ipcRenderer.invoke("file:getImageData", filePath),
  getUtmCampaigns: (emailId: number) => ipcRenderer.invoke("email:getUtmCampaigns", emailId),
  setEmailId: (id: number, emailId: string) => ipcRenderer.invoke("email:setEmailId", id, emailId),

  // PDF Export
  getPreviewHtml: (emailId: string) => ipcRenderer.invoke("email:getPreviewHtml", emailId),
  exportPdf: (emailId: string) => ipcRenderer.invoke("email:exportPdf", emailId),
});
