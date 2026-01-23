// Composable for database operations via Electron IPC
import type {
  NewEmail,
  Email,
  EmailWithRelations,
  Link,
  Image,
  QAChecklistItem,
  NewQANote,
  QANote,
  Attachment,
  SpellError,
} from "@@/lib/db/schema";
import type {
  IpcResponse,
  IpcVoidResponse,
  EmailUploadResponse,
  EmailAnalyzeResponse,
  PdfExportResponse,
} from "@@/types/ipc";
import type { AttachmentWithData } from "@@/types/electron-api";
import type { UtmCampaignsData } from "@@/types/progress";

export const useDatabase = () => {
  const api = import.meta.client ? window.electronAPI : null;

  if (!api && import.meta.client) {
    console.warn("Electron API not available - running in browser mode");
  }

  // Email operations
  const getEmails = async (): Promise<IpcResponse<Email[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getEmails();
  };

  const getEmail = async (id: number): Promise<IpcResponse<EmailWithRelations | undefined>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getEmail(id);
  };

  const createEmail = async (data: NewEmail): Promise<IpcResponse<Email>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.createEmail(data);
  };

  const updateEmail = async (id: number, data: Partial<Email>): Promise<IpcResponse<Email>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateEmail(id, data);
  };

  const deleteEmail = async (id: number): Promise<IpcVoidResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteEmail(id);
  };

  // Link operations
  const getLinks = async (emailId: number): Promise<IpcResponse<Link[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getLinks(emailId);
  };

  const updateLink = async (id: number, data: Partial<Link>): Promise<IpcResponse<Link>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateLink(id, data);
  };

  const reanalyzeLink = async (linkId: number, emailId: number): Promise<IpcResponse<Link>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.reanalyzeLink(linkId, emailId);
  };

  // Image operations
  const getImages = async (emailId: number): Promise<IpcResponse<Image[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getImages(emailId);
  };

  const updateImage = async (id: number, data: Partial<Image>): Promise<IpcResponse<Image>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateImage(id, data);
  };

  // QA Checklist operations
  const getQAChecklist = async (emailId: number): Promise<IpcResponse<QAChecklistItem[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getQAChecklist(emailId);
  };

  const updateQAChecklistItem = async (id: number, data: Partial<QAChecklistItem>): Promise<IpcResponse<QAChecklistItem>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateQAChecklistItem(id, data);
  };

  // QA Notes operations
  const getQANotes = async (emailId: number): Promise<IpcResponse<QANote[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getQANotes(emailId);
  };

  const createQANote = async (data: NewQANote): Promise<IpcResponse<QANote>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.createQANote(data);
  };

  const deleteQANote = async (id: number): Promise<IpcVoidResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteQANote(id);
  };

  // Attachments operations
  const getAttachments = async (emailId: number): Promise<IpcResponse<AttachmentWithData[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getAttachments(emailId);
  };

  const selectAttachments = async (): Promise<IpcResponse<string[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.selectAttachments();
  };

  const createAttachments = async (emailId: number, filePaths: string[], description?: string, type?: string): Promise<IpcResponse<Attachment[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.createAttachments(emailId, filePaths, description, type);
  };

  const deleteAttachment = async (id: number): Promise<IpcVoidResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteAttachment(id);
  };

  // Spell Errors operations
  const getSpellErrors = async (emailId: number): Promise<IpcResponse<SpellError[]>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getSpellErrors(emailId);
  };

  const deleteSpellError = async (id: number): Promise<IpcVoidResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteSpellError(id);
  };

  // File operations
  const selectFile = async (): Promise<IpcResponse<string | null>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.selectFile();
  };

  const uploadEmail = async (filePath: string): Promise<EmailUploadResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.uploadEmail(filePath);
  };

  const analyzeEmail = async (emailId: number): Promise<EmailAnalyzeResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.analyzeEmail(emailId);
  };

  const getImageData = async (filePath: string): Promise<IpcResponse<string>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getImageData(filePath);
  };

  const getUtmCampaigns = async (emailId: number): Promise<IpcResponse<UtmCampaignsData>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getUtmCampaigns(emailId);
  };

  const setEmailId = async (id: number, emailId: string): Promise<IpcResponse<Email>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.setEmailId(id, emailId);
  };

  // PDF Export
  const getPreviewHtml = async (emailId: string): Promise<IpcResponse<string>> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getPreviewHtml(emailId);
  };

  const exportPdf = async (emailId: string): Promise<PdfExportResponse> => {
    if (!api) return { success: false, error: "API not available" };
    return await api.exportPdf(emailId);
  };

  return {
    // Email operations
    getEmails,
    getEmail,
    createEmail,
    updateEmail,
    deleteEmail,

    // Link operations
    getLinks,
    updateLink,
    reanalyzeLink,

    // Image operations
    getImages,
    updateImage,

    // QA Checklist operations
    getQAChecklist,
    updateQAChecklistItem,

    // QA Notes operations
    getQANotes,
    createQANote,
    deleteQANote,

    // Attachments operations
    getAttachments,
    selectAttachments,
    createAttachments,
    deleteAttachment,

    // Spell Errors operations
    getSpellErrors,
    deleteSpellError,

    // File operations
    selectFile,
    uploadEmail,
    analyzeEmail,
    getImageData,
    getUtmCampaigns,
    setEmailId,

    // PDF Export
    getPreviewHtml,
    exportPdf,
  };
};
