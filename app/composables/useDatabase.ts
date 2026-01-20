// Composable for database operations via Electron IPC
import type {
  NewEmail,
  Email,
  Link,
  Image,
  QAChecklistItem,
  NewQANote,
} from "@@/lib/db/schema";

export const useDatabase = () => {
  console.log('useDatabase called');
  console.log('process.client:', import.meta.client);
  console.log('window:', typeof window !== 'undefined' ? window : 'undefined');
  console.log('window.electronAPI:', typeof window !== 'undefined' ? window.electronAPI : 'undefined');

  const api = import.meta.client ? window.electronAPI : null;

  if (!api && import.meta.client) {
    console.warn("Electron API not available - running in browser mode");
  }

  // Email operations
  const getEmails = async () => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getEmails();
  };

  const getEmail = async (id: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getEmail(id);
  };

  const createEmail = async (data: NewEmail) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.createEmail(data);
  };

  const updateEmail = async (id: number, data: Partial<Email>) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateEmail(id, data);
  };

  const deleteEmail = async (id: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteEmail(id);
  };

  // Link operations
  const getLinks = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getLinks(emailId);
  };

  const updateLink = async (id: number, data: Partial<Link>) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateLink(id, data);
  };

  // Image operations
  const getImages = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getImages(emailId);
  };

  const updateImage = async (id: number, data: Partial<Image>) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateImage(id, data);
  };

  // QA Checklist operations
  const getQAChecklist = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getQAChecklist(emailId);
  };

  const updateQAChecklistItem = async (id: number, data: Partial<QAChecklistItem>) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.updateQAChecklistItem(id, data);
  };

  // QA Notes operations
  const getQANotes = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getQANotes(emailId);
  };

  const createQANote = async (data: NewQANote) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.createQANote(data);
  };

  const deleteQANote = async (id: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteQANote(id);
  };

  // Attachments operations
  const getAttachments = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getAttachments(emailId);
  };

  const selectAttachments = async () => {
    if (!api) return { success: false, error: "API not available" };
    return await api.selectAttachments();
  };

  const createAttachments = async (emailId: number, filePaths: string[], description?: string, type?: string) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.createAttachments(emailId, filePaths, description, type);
  };

  const deleteAttachment = async (id: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteAttachment(id);
  };

  // Spell Errors operations
  const getSpellErrors = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getSpellErrors(emailId);
  };

  const deleteSpellError = async (id: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.deleteSpellError(id);
  };

  // File operations
  const selectFile = async () => {
    if (!api) return { success: false, error: "API not available" };
    return await api.selectFile();
  };

  const uploadEmail = async (filePath: string) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.uploadEmail(filePath);
  };

  const analyzeEmail = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.analyzeEmail(emailId);
  };

  const getImageData = async (filePath: string) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getImageData(filePath);
  };

  const getUtmCampaigns = async (emailId: number) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getUtmCampaigns(emailId);
  };

  const setEmailId = async (id: number, emailId: string) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.setEmailId(id, emailId);
  };

  // PDF Export
  const getPreviewHtml = async (emailId: string) => {
    if (!api) return { success: false, error: "API not available" };
    return await api.getPreviewHtml(emailId);
  };

  const exportPdf = async (emailId: string) => {
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
