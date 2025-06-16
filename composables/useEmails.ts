// composables/useEmails.ts
import type { Ref } from "vue";

export type Email = {
  id: string;
  filename: string;
  subject?: string;
  analyzed: boolean;
  createdAt: number;
};

export type UploadEmailData = {
  file: File;
  name: string;
};

export type UploadProgressCallback = (
  fileName: string, 
  status: 'pending' | 'uploading' | 'success' | 'error', 
  error?: string
) => void;
// State
const emails: Ref<Email[]> = ref([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useEmails() {
  // Upload state
  const isUploading = ref(false);
  const uploadError = ref<string | null>(null);

  // Fetch all emails
  const fetchEmails = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const data = await $fetch<Email[]>("/api/email");
      emails.value = data || [];
    }
    catch (err) {
      console.error("Failed to fetch emails:", err);
      error.value = "Failed to load emails";
      emails.value = [];
    }
    finally {
      isLoading.value = false;
    }
  };

  // Upload new email
  const uploadEmail = async (uploadData: UploadEmailData): Promise<boolean> => {
    if (!uploadData.file || !uploadData.name.trim()) {
      uploadError.value = "Please select a file and enter an email name";
      return false;
    }

    isUploading.value = true;
    uploadError.value = null;

    try {
      const formData = new FormData();
      formData.append("file", uploadData.file);
      formData.append("email", uploadData.name.trim());

      await $fetch("/api/email", {
        method: "POST",
        body: formData,
      });

      // Refresh the email list after successful upload
      await fetchEmails();
      return true;
    }
    catch (err) {
      console.error("Upload failed:", err);
      uploadError.value = "Failed to upload email. Please try again.";
      return false;
    }
    finally {
      isUploading.value = false;
    }
  };

  // Upload multiple emails
  const uploadEmails = async (files: File[], onProgress?: UploadProgressCallback): Promise<boolean> => {
    if (files.length === 0) {
      uploadError.value = "Please select at least one file";
      return false;
    }

    isUploading.value = true;
    uploadError.value = null;

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const fileName = file.name;
      
      try {
        onProgress?.(fileName, 'uploading');
        
        const formData = new FormData();
        formData.append("file", file);
        // Use filename without extension as email name
        const emailName = fileName.replace(/\.[^/.]+$/, "");
        formData.append("email", emailName);

        await $fetch("/api/email", {
          method: "POST",
          body: formData,
        });

        onProgress?.(fileName, 'success');
        successCount++;
      }
      catch (err) {
        console.error(`Upload failed for ${fileName}:`, err);
        const errorMessage = err instanceof Error ? err.message : "Upload failed";
        onProgress?.(fileName, 'error', errorMessage);
        errorCount++;
      }
    }

    isUploading.value = false;

    if (errorCount > 0) {
      uploadError.value = `${errorCount} of ${files.length} files failed to upload`;
    }

    // Refresh the email list after uploads
    await fetchEmails();

    // Return true if all uploads succeeded
    return errorCount === 0;
  };

  return {
    // State
    emails,
    isLoading,
    error,
    isUploading,
    uploadError,

    // Actions
    fetchEmails,
    uploadEmail,
    uploadEmails,
  };
}
