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
  };
}
