/**
 * Generic IPC response types for type-safe communication
 * between main and renderer processes.
 */

/** Successful IPC response with data */
export type IpcSuccess<T> = { success: true; data: T };

/** Failed IPC response with error message */
export type IpcError = { success: false; error: string };

/** Generic IPC response - either success with data or error */
export type IpcResponse<T> = IpcSuccess<T> | IpcError;

/** IPC response for void operations (no data returned on success) */
export type IpcVoidResponse = { success: true } | IpcError;

/** IPC response with optional message (e.g., upload operations) */
export type IpcMessageResponse = { success: true; message?: string } | IpcError;

/** Email upload response with message and emailId */
export type EmailUploadResponse =
  | { success: true; message: string; emailId: number }
  | IpcError;

/** Email analyze response with analysis data */
export type EmailAnalyzeResponse =
  | {
      success: true;
      message: string;
      data: {
        linksCount: number;
        imagesCount: number;
        spellErrorsCount: number;
        subject: string | null;
        emailId: string | null;
      };
    }
  | IpcError;

/** PDF export response with file path */
export type PdfExportResponse =
  | { success: true; data: { filePath: string } }
  | IpcError;

/** Browser install response with message */
export type BrowserInstallResponse =
  | { success: true; message: string }
  | IpcError;
