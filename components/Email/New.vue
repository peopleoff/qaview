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
const uploadFile = ref<File | null>(null);
const emailName = ref("");

const emails = useEmails();

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0];
    // Auto-populate email name from filename (without extension)
    const fileName = target.files[0].name;
    emailName.value = fileName.replace(/\.[^/.]+$/, "");
  }
}

async function handleUpload() {
  if (!uploadFile.value || !emailName.value.trim()) {
    alert("Please select a file and enter an email name.");
    return;
  }

  await emails.uploadEmail({
    file: uploadFile.value,
    name: emailName.value,
  });
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
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload Email for Analysis</DialogTitle>
        <DialogDescription>
          Upload an .eml file to analyze its links, images, and overall quality.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <label for="email-name" class="block text-sm font-medium mb-2">Email Name</label>
          <input
            id="email-name"
            v-model="emailName"
            type="text"
            placeholder="Enter email name"
            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
        </div>
        <div>
          <label for="file-upload" class="block text-sm font-medium mb-2">Email File (.eml)</label>
          <input
            id="file-upload"
            type="file"
            accept=".eml"
            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            @change="handleFileChange"
          >
        </div>
        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="showUploadDialog = false">
            Cancel
          </Button>
          <Button :disabled="emails.isUploading.value" @click="handleUpload">
            {{ emails.isUploading.value ? 'Uploading...' : 'Upload' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
