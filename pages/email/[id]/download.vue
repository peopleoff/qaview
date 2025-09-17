<script lang="ts" setup>
import { Button } from "@/components/ui/button";

const { id } = useRoute().params;
const downloadStatus = ref<"preparing" | "downloading" | "complete" | "error">("preparing");
const errorMessage = ref("");

onMounted(async () => {
  try {
    // Check if email exists and is analyzed
    const emailData = await $fetch(`/api/email/${id}`);

    if (!emailData.analyzed) {
      errorMessage.value = "Email must be analyzed before downloading report.";
      downloadStatus.value = "error";
      return;
    }

    downloadStatus.value = "downloading";

    // Generate filename using emailId if available, fallback to database ID
    const filename = emailData.emailId ? `${emailData.emailId}-qa.pdf` : `${id}-qa.pdf`;

    // Start the download
    const downloadUrl = `/api/email/${id}/export`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Mark as complete
    downloadStatus.value = "complete";

    // Close window after a short delay
    setTimeout(() => {
      // Try to close the window/tab
      window.close();

      // If window.close() doesn't work (popup blockers, etc.),
      // redirect back to the email page
      setTimeout(() => {
        navigateTo(`/email/${id}`);
      }, 1000);
    }, 2000);
  }
  catch (error) {
    console.error("Download failed:", error);
    errorMessage.value = "Failed to download report. Please try again.";
    downloadStatus.value = "error";
  }
});

// Handle navigation back to email page
function goBack() {
  navigateTo(`/email/${id}`);
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full mx-4">
      <div class="bg-white rounded-lg shadow-lg p-6 text-center">
        <!-- Preparing -->
        <div v-if="downloadStatus === 'preparing'" class="space-y-4">
          <div class="w-12 h-12 mx-auto">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900">
            Preparing Download
          </h2>
          <p class="text-gray-600">
            Getting your QA report ready...
          </p>
        </div>

        <!-- Downloading -->
        <div v-else-if="downloadStatus === 'downloading'" class="space-y-4">
          <div class="w-12 h-12 mx-auto">
            <Icon name="mdi:download" class="w-12 h-12 text-blue-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900">
            Downloading Report
          </h2>
          <p class="text-gray-600">
            Your QA report is being downloaded...
          </p>
        </div>

        <!-- Complete -->
        <div v-else-if="downloadStatus === 'complete'" class="space-y-4">
          <div class="w-12 h-12 mx-auto">
            <Icon name="mdi:check-circle" class="w-12 h-12 text-green-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900">
            Download Complete
          </h2>
          <p class="text-gray-600">
            Your QA report has been downloaded successfully.
          </p>
          <p class="text-sm text-gray-500">
            This window will close automatically...
          </p>
          <Button
            variant="outline"
            class="mt-4"
            @click="goBack"
          >
            Return to Email
          </Button>
        </div>

        <!-- Error -->
        <div v-else-if="downloadStatus === 'error'" class="space-y-4">
          <div class="w-12 h-12 mx-auto">
            <Icon name="mdi:alert-circle" class="w-12 h-12 text-red-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900">
            Download Failed
          </h2>
          <p class="text-gray-600">
            {{ errorMessage }}
          </p>
          <div class="flex gap-2 justify-center">
            <Button variant="outline" @click="goBack">
              Go Back
            </Button>
            <Button class="bg-blue-600 hover:bg-blue-700" @click="$router.go(0)">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
