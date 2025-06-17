<script setup lang="ts">
import type { Attachment } from "@/types/Email";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const props = defineProps<{
  emailId: number;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const { data: attachments, refresh: refreshAttachments } = await useFetch<Attachment[]>(`/api/email/${props.emailId}/attachments`);

const isUploading = ref(false);
const selectedFiles = ref<FileList | null>(null);
const description = ref("");
const attachmentType = ref("general");
const deletingIds = ref<Set<number>>(new Set());
const isDragOver = ref(false);

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFiles.value = target.files;
  if (selectedFiles.value && selectedFiles.value.length > 0) {
    uploadFiles();
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    selectedFiles.value = files;
    uploadFiles();
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

function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

async function uploadFiles() {
  if (!selectedFiles.value || selectedFiles.value.length === 0)
    return;

  isUploading.value = true;

  try {
    const formData = new FormData();

    for (let i = 0; i < selectedFiles.value.length; i++) {
      formData.append("files", selectedFiles.value[i]);
    }

    if (description.value.trim()) {
      formData.append("description", description.value.trim());
    }

    formData.append("type", attachmentType.value);

    await $fetch(`/api/email/${props.emailId}/attachments`, {
      method: "POST",
      body: formData,
    });

    // Reset form
    selectedFiles.value = null;
    description.value = "";

    // Refresh data
    await refreshAttachments();
    emit("refresh");
  }
  catch (error) {
    console.error("Upload failed:", error);
  }
  finally {
    isUploading.value = false;
  }
}

async function deleteAttachment(attachmentId: number) {
  deletingIds.value.add(attachmentId);

  try {
    await $fetch(`/api/attachments/${attachmentId}`, {
      method: "DELETE",
    });

    await refreshAttachments();
    emit("refresh");
  }
  catch (error) {
    console.error("Delete failed:", error);
  }
  finally {
    deletingIds.value.delete(attachmentId);
  }
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/"))
    return "lucide:image";
  return "lucide:file";
}
</script>

<template>
  <Card>
    <CardHeader>
      <div>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>Upload and manage files related to this email analysis</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <!-- Existing Attachments -->
        <div
          v-for="attachment in attachments"
          :key="attachment.id"
          class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
        >
          <!-- Preview -->
          <div class="flex-shrink-0">
            <img
              v-if="attachment.mimeType.startsWith('image/')"
              :src="attachment.path"
              :alt="attachment.originalName"
              class="w-16 h-16 object-cover rounded border"
            >
            <div v-else class="w-16 h-16 bg-accent rounded border flex items-center justify-center">
              <Icon :name="getFileIcon(attachment.mimeType)" class="h-8 w-8 text-accent-foreground" />
            </div>
          </div>

          <!-- Details -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <p class="text-sm font-medium text-foreground truncate">
                {{ attachment.originalName }}
              </p>
              <Badge variant="secondary" class="text-xs">
                {{ formatFileSize(attachment.size) }}
              </Badge>
              <Badge
                v-if="attachment.type && attachment.type !== 'general'"
                variant="outline"
                class="text-xs"
              >
                {{ attachment.type }}
              </Badge>
              <Badge
                v-if="attachment.isEdited"
                variant="secondary"
                class="text-xs"
              >
                Edited
              </Badge>
            </div>
            <p v-if="attachment.description" class="text-sm text-muted-foreground mb-1">
              {{ attachment.description }}
            </p>
            <p class="text-xs text-muted-foreground">
              Uploaded {{ new Date(attachment.createdAt).toLocaleDateString() }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex-shrink-0 flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              as="a"
              :href="attachment.path"
              target="_blank"
              title="View full size"
            >
              <Icon name="lucide:external-link" class="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="deletingIds.has(attachment.id)"
              title="Delete attachment"
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
              @click="deleteAttachment(attachment.id)"
            >
              <Icon
                :name="deletingIds.has(attachment.id) ? 'lucide:loader-2' : 'lucide:trash-2'"
                :class="deletingIds.has(attachment.id) ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
              />
            </Button>
          </div>
        </div>

        <!-- Upload Zone -->
        <div
          class="relative border-2 border-dashed rounded-lg p-4 text-center transition-colors"
          :class="[
            isDragOver || isUploading
              ? 'border-blue-400 bg-blue-50'
              : 'border-accent hover:border-accent hover:bg-accent',
            isUploading ? 'pointer-events-none' : 'cursor-pointer',
          ]"
          @click="!isUploading && ($refs.fileInput as HTMLInputElement)?.click()"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          >

          <div v-if="isUploading" class="flex items-center justify-center space-x-2">
            <Icon name="lucide:loader-2" class="h-8 w-8 text-blue-500 animate-spin" />
            <span class="text-blue-600 font-medium">Uploading...</span>
          </div>

          <div v-else class="space-y-2">
            <Icon name="lucide:upload" class="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-medium text-foreground">
              {{ attachments && attachments.length > 0 ? 'Add more attachments' : 'Upload attachments' }}
            </h3>
            <p class="text-muted-foreground">
              Drag and drop images here, or click to select files
            </p>
            <p class="text-xs text-muted-foreground">
              Supports: JPG, PNG, GIF, WebP (max 10MB each)
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
