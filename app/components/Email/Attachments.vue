<script setup lang="ts">
const props = defineProps<{
  emailId: number;
}>();

const { getAttachments, selectAttachments, createAttachments, deleteAttachment } = useDatabase();

const attachments = ref<any[]>([]);
const isUploading = ref(false);
const isLoading = ref(true);
const deletingIds = ref<Set<number>>(new Set());
const isDragOver = ref(false);

async function loadAttachments() {
  isLoading.value = true;
  const response = await getAttachments(props.emailId);
  if (response.success && response.data) {
    attachments.value = response.data;
  }
  isLoading.value = false;
}

async function handleFileSelect() {
  const response = await selectAttachments();
  if (response.success && response.data && response.data.length > 0) {
    await uploadFiles(response.data);
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    // Convert FileList to file paths - but in Electron we can't get file paths from drag/drop
    // So we'll only support click-to-select for now
    alert("Please use the 'Click to select files' button to upload attachments.");
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
}

async function uploadFiles(filePaths: string[]) {
  isUploading.value = true;

  try {
    const response = await createAttachments(props.emailId, filePaths);

    if (response.success) {
      await loadAttachments();
    } else {
      alert(`Upload failed: ${response.error}`);
    }
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Upload failed. Please try again.");
  } finally {
    isUploading.value = false;
  }
}

async function removeAttachment(attachmentId: number) {
  deletingIds.value.add(attachmentId);

  try {
    const response = await deleteAttachment(attachmentId);
    if (response.success) {
      await loadAttachments();
    } else {
      alert(`Failed to delete attachment: ${response.error}`);
    }
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Delete failed. Please try again.");
  } finally {
    deletingIds.value.delete(attachmentId);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "i-heroicons-photo";
  return "i-heroicons-document";
}

onMounted(() => {
  loadAttachments();
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h2 class="text-2xl font-semibold">Attachments</h2>
          <p class="text-sm text-gray-500 mt-1">
            Upload and manage files related to this email analysis
          </p>
        </div>
        <UButton
          size="sm"
          @click="handleFileSelect"
          :disabled="isUploading"
        >
          <UIcon name="i-heroicons-arrow-up-tray" class="mr-2" />
          Upload Files
        </UButton>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 text-gray-400 animate-spin" />
      <p class="mt-2 text-gray-500">Loading attachments...</p>
    </div>

    <!-- Uploading State -->
    <div v-else-if="isUploading" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="h-12 w-12 text-blue-500 animate-spin mx-auto" />
      <p class="mt-4 text-blue-600 dark:text-blue-400 font-medium">Uploading...</p>
    </div>

    <!-- Attachments List -->
    <div v-else-if="attachments.length > 0" class="space-y-3">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
      >
        <!-- Preview -->
        <div class="flex-shrink-0">
          <img
            v-if="attachment.mimeType.startsWith('image/') && attachment.dataUrl"
            :src="attachment.dataUrl"
            :alt="attachment.originalName"
            class="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-800"
          >
          <div v-else class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <UIcon :name="getFileIcon(attachment.mimeType)" class="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <p class="text-sm font-medium truncate">
              {{ attachment.originalName }}
            </p>
            <UBadge color="gray" variant="subtle" size="xs">
              {{ formatFileSize(attachment.size) }}
            </UBadge>
            <UBadge
              v-if="attachment.type && attachment.type !== 'general'"
              variant="outline"
              size="xs"
            >
              {{ attachment.type }}
            </UBadge>
            <UBadge
              v-if="attachment.isEdited"
              color="gray"
              variant="subtle"
              size="xs"
            >
              Edited
            </UBadge>
          </div>
          <p v-if="attachment.description" class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {{ attachment.description }}
          </p>
          <p class="text-xs text-gray-500">
            Uploaded {{ new Date(attachment.createdAt).toLocaleDateString() }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 flex items-center space-x-2">
          <UButton
            variant="ghost"
            size="xs"
            color="red"
            :disabled="deletingIds.has(attachment.id)"
            @click="removeAttachment(attachment.id)"
          >
            <UIcon
              :name="deletingIds.has(attachment.id) ? 'i-heroicons-arrow-path' : 'i-heroicons-trash'"
              :class="deletingIds.has(attachment.id) ? 'animate-spin' : ''"
            />
          </UButton>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-6 text-gray-500 text-sm">
      No attachments
    </div>
  </UCard>
</template>
