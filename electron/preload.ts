import { contextBridge, ipcRenderer } from "electron";

console.log('Preload script running...');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Browser management
  isBrowserInstalled: () => ipcRenderer.invoke("browser:isInstalled"),
  installBrowser: () => ipcRenderer.invoke("browser:install"),
  onBrowserInstallProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on("browser:installProgress", (_event, progress) => callback(progress));
  },
  onAnalysisProgress: (callback: (progress: {
    stage: 'parsing' | 'screenshots' | 'links' | 'images' | 'complete';
    message: string;
    current?: number;
    total?: number;
  }) => void) => {
    ipcRenderer.on("email:analysisProgress", (_event, progress) => callback(progress));
  },
  removeAnalysisProgressListener: () => {
    ipcRenderer.removeAllListeners("email:analysisProgress");
  },

  // Email operations
  getEmails: () => ipcRenderer.invoke("db:getEmails"),
  getEmail: (id: number) => ipcRenderer.invoke("db:getEmail", id),
  createEmail: (data: any) => ipcRenderer.invoke("db:createEmail", data),
  updateEmail: (id: number, data: any) =>
    ipcRenderer.invoke("db:updateEmail", id, data),
  deleteEmail: (id: number) => ipcRenderer.invoke("db:deleteEmail", id),

  // Link operations
  getLinks: (emailId: number) => ipcRenderer.invoke("db:getLinks", emailId),
  updateLink: (id: number, data: any) =>
    ipcRenderer.invoke("db:updateLink", id, data),
  createLinks: (links: any[]) => ipcRenderer.invoke("db:createLinks", links),

  // Image operations
  getImages: (emailId: number) => ipcRenderer.invoke("db:getImages", emailId),
  updateImage: (id: number, data: any) =>
    ipcRenderer.invoke("db:updateImage", id, data),
  createImages: (images: any[]) => ipcRenderer.invoke("db:createImages", images),

  // QA Checklist operations
  getQAChecklist: (emailId: number) =>
    ipcRenderer.invoke("db:getQAChecklist", emailId),
  updateQAChecklistItem: (id: number, data: any) =>
    ipcRenderer.invoke("db:updateQAChecklistItem", id, data),

  // QA Notes operations
  getQANotes: (emailId: number) => ipcRenderer.invoke("db:getQANotes", emailId),
  createQANote: (data: any) => ipcRenderer.invoke("db:createQANote", data),
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

console.log('Preload script completed. electronAPI should be available on window.');
