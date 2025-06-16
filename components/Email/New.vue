<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const showUploadDialog = ref(false);
const uploadFiles = ref<File[]>([]);
const uploadProgress = ref<Record<string, { status: "pending" | "uploading" | "success" | "error"; error?: string }>>({});

const emails = useEmails();

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    uploadFiles.value = Array.from(target.files);
    // Initialize progress tracking
    uploadProgress.value = {};
    for (const file of uploadFiles.value) {
      uploadProgress.value[file.name] = { status: "pending" };
    }
  }
}

function removeFile(index: number) {
  const fileName = uploadFiles.value[index].name;
  uploadFiles.value.splice(index, 1);
  delete uploadProgress.value[fileName];
}

async function handleUpload() {
  if (uploadFiles.value.length === 0) {
    alert("Please select at least one file.");
    return;
  }

  const success = await emails.uploadEmails(uploadFiles.value, (fileName, status, error) => {
    uploadProgress.value[fileName] = { status, error };
  });

  if (success) {
    showUploadDialog.value = false;
    // Reset state
    uploadFiles.value = [];
    uploadProgress.value = {};
  }
}

function resetDialog() {
  uploadFiles.value = [];
  uploadProgress.value = {};
  showUploadDialog.value = false;
}
</script>

<template>
  <Dialog v-model:open="showUploadDialog">
    <DialogTrigger as-child>
      <Button>
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        Upload New Email
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Upload Emails for Analysis</DialogTitle>
        <DialogDescription>
          Upload one or more .eml files to analyze their links, images, and overall quality.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 max-w-xl">
        <div>
          <label for="file-upload" class="block text-sm font-medium mb-2">Email Files (.eml)</label>
          <input
            id="file-upload"
            type="file"
            accept=".eml"
            multiple
            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            @change="handleFileChange"
          >
          <p class="text-sm text-muted-foreground mt-1">
            Select multiple .eml files to upload them all at once
          </p>
        </div>

        <!-- File List -->
        <div v-if="uploadFiles.length > 0" class="space-y-2 max-w-full">
          <h3 class="text-sm font-medium">
            Selected Files ({{ uploadFiles.length }})
          </h3>
          <div class="max-h-48 overflow-y-auto space-y-1 max-w-full">
            <div
              v-for="(file, index) in uploadFiles"
              :key="`${file.name}-${index}`"
              class="flex items-center justify-between p-2 border rounded-md text-sm min-w-0"
            >
              <div class="flex items-center space-x-2 flex-1 min-w-0">
                <Icon name="lucide:file-text" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span class="truncate flex-1 min-w-0" :title="file.name">{{ file.name }}</span>
                <span class="text-muted-foreground text-xs flex-shrink-0">
                  ({{ Math.round(file.size / 1024) }}KB)
                </span>
              </div>

              <!-- Status indicator -->
              <div class="flex items-center space-x-2 flex-shrink-0">
                <span
                  v-if="uploadProgress[file.name]"
                  class="text-xs px-2 py-1 rounded whitespace-nowrap"
                  :class="{
                    'bg-gray-100 text-gray-600': uploadProgress[file.name].status === 'pending',
                    'bg-blue-100 text-blue-600': uploadProgress[file.name].status === 'uploading',
                    'bg-green-100 text-green-600': uploadProgress[file.name].status === 'success',
                    'bg-red-100 text-red-600': uploadProgress[file.name].status === 'error',
                  }"
                >
                  {{
                    uploadProgress[file.name].status === 'pending' ? 'Pending'
                    : uploadProgress[file.name].status === 'uploading' ? 'Uploading...'
                      : uploadProgress[file.name].status === 'success' ? 'Success'
                        : 'Error'
                  }}
                </span>

                <Button
                  v-if="uploadProgress[file.name]?.status !== 'uploading'"
                  variant="ghost"
                  size="sm"
                  @click="removeFile(index)"
                  class="flex-shrink-0"
                >
                  <Icon name="lucide:x" class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Error messages -->
          <div v-if="Object.values(uploadProgress).some(p => p.status === 'error')" class="space-y-1">
            <div
              v-for="(progress, fileName) in uploadProgress"
              :key="fileName"
              class="text-sm text-red-600"
            >
              <span v-if="progress.status === 'error'">
                {{ fileName }}: {{ progress.error }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="resetDialog">
            Cancel
          </Button>
          <Button
            :disabled="uploadFiles.length === 0 || emails.isUploading.value"
            @click="handleUpload"
          >
            {{
              emails.isUploading.value ? 'Uploading...'
              : uploadFiles.length === 0 ? 'Select Files'
                : uploadFiles.length === 1 ? 'Upload 1 File'
                  : `Upload ${uploadFiles.length} Files`
            }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
