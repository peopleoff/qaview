<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="max-w-md w-full">
      <UCard>
        <template #header>
          <div class="text-center space-y-2">
            <div class="flex justify-center">
              <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <UIcon name="i-heroicons-arrow-down-tray" class="w-8 h-8 text-primary-500" />
              </div>
            </div>
            <h1 class="text-2xl font-bold">Welcome to QAView</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              One-time setup required
            </p>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Setup Info -->
          <div v-if="!isDownloading && !downloadComplete" class="space-y-4">
            <p class="text-gray-700 dark:text-gray-300">
              QAView uses Chromium browser to analyze your emails. We need to
              download it before you can start.
            </p>

            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500 mt-0.5" />
                <div class="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                  <p><strong>Download size:</strong> ~300MB</p>
                  <p><strong>Time:</strong> 2-5 minutes</p>
                  <p><strong>Frequency:</strong> One-time only</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Download Progress -->
          <div v-if="isDownloading" class="space-y-4">
            <div class="text-center space-y-2">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-primary-500 animate-spin" />
              </div>
              <p class="text-sm font-medium">{{ progress.message }}</p>
            </div>

            <div>
              <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Downloading Chromium...</span>
                <span>{{ progress.percent }}%</span>
              </div>
              <UProgress :value="progress.percent" size="lg" />
            </div>

            <p class="text-xs text-center text-gray-500 dark:text-gray-500">
              Please keep this window open
            </p>
          </div>

          <!-- Download Complete -->
          <div v-if="downloadComplete" class="text-center space-y-4">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
              <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-green-500" />
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                All set!
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                You're ready to start analyzing emails
              </p>
            </div>
          </div>

          <!-- Error State -->
          <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  Download Failed
                </h3>
                <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                  {{ error }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              v-if="!isDownloading && !downloadComplete"
              variant="ghost"
              @click="skipSetup"
            >
              Skip for now
            </UButton>
            <UButton
              v-if="!isDownloading && !downloadComplete"
              :disabled="isDownloading"
              @click="startDownload"
            >
              Download Browser
            </UButton>
            <UButton
              v-if="error"
              color="red"
              @click="startDownload"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              Retry Download
            </UButton>
            <UButton
              v-if="downloadComplete"
              @click="goToHome"
            >
              Get Started
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false, // Use no layout for setup page
});

const router = useRouter();

const isDownloading = ref(false);
const downloadComplete = ref(false);
const error = ref<string | null>(null);
const progress = ref({
  percent: 0,
  message: "Preparing download...",
});

// Listen for progress updates
if (process.client && window.electronAPI) {
  window.electronAPI.onBrowserInstallProgress((progressData: any) => {
    progress.value = progressData;
  });
}

async function startDownload() {
  if (!window.electronAPI) {
    error.value = "Electron API not available";
    return;
  }

  isDownloading.value = true;
  error.value = null;
  progress.value = { percent: 0, message: "Starting download..." };

  try {
    const result = await window.electronAPI.installBrowser();

    if (result.success) {
      progress.value = { percent: 100, message: "Installation complete!" };
      downloadComplete.value = true;
      isDownloading.value = false;
    } else {
      error.value = result.error || "Installation failed";
      isDownloading.value = false;
    }
  } catch (err: any) {
    error.value = err.message || "An unexpected error occurred";
    isDownloading.value = false;
  }
}

function skipSetup() {
  // Clear the browser check flag so it will check again on next app launch
  sessionStorage.removeItem('browser-check-done');
  // Allow user to skip, but they won't be able to analyze until they come back
  router.push("/");
}

function goToHome() {
  // Mark browser check as done since installation completed successfully
  sessionStorage.setItem('browser-check-done', 'true');
  router.push("/");
}
</script>
