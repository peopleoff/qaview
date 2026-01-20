export {}

declare global {
  interface Window {
    electronAPI: {
      // Browser management
      isBrowserInstalled: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
      installBrowser: () => Promise<{ success: boolean; message?: string; error?: string }>;
      onBrowserInstallProgress: (callback: (progress: { percent: number; message: string }) => void) => void;

      // Email operations
      getEmails: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getEmail: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>;
      createEmail: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      updateEmail: (id: number, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      deleteEmail: (id: number) => Promise<{ success: boolean; error?: string }>;

      // Link operations
      getLinks: (emailId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      updateLink: (id: number, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;

      // Image operations
      getImages: (emailId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      updateImage: (id: number, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;

      // QA Checklist operations
      getQAChecklist: (emailId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      updateQAChecklistItem: (id: number, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;

      // QA Notes operations
      getQANotes: (emailId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      createQANote: (data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      deleteQANote: (id: number) => Promise<{ success: boolean; error?: string }>;

      // Spell Errors operations
      getSpellErrors: (emailId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;

      // File operations
      selectFile: () => Promise<{ success: boolean; data?: string | null; error?: string }>;
      uploadEmail: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      analyzeEmail: (emailId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
      getImageData: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;

      // PDF Export
      exportPdf: (emailId: string) => Promise<{ success: boolean; data?: { filePath: string }; error?: string }>;
    };
  }
}
