<script lang="ts" setup>
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const { data: emails, refresh } = useAsyncData("emails", () => $fetch("/api/email"));

const showUploadDialog = ref(false);
const uploadFile = ref<File | null>(null);
const emailName = ref("");
const isUploading = ref(false);

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

  isUploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", uploadFile.value);
    formData.append("email", emailName.value.trim());

    await $fetch("/api/email", {
      method: "POST",
      body: formData,
    });

    // Reset form
    uploadFile.value = null;
    emailName.value = "";
    showUploadDialog.value = false;

    // Refresh email list
    await refresh();

    alert("Email uploaded successfully!");
  }
  catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to upload email. Please try again.");
  }
  finally {
    isUploading.value = false;
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-background border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-primary">
              QA Buddy
            </h1>
            <p class="mt-2 text-muted-foreground">
              Email quality assurance analysis tool
            </p>
          </div>
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
                  <Button :disabled="isUploading" @click="handleUpload">
                    {{ isUploading ? 'Uploading...' : 'Upload' }}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Analysis History</CardTitle>
          <CardDescription>
            View and manage your analyzed emails. Click on any email to view detailed analysis results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="emails && emails.length > 0">
            <Table>
              <TableCaption>
                {{ emails.length }} email{{ emails.length !== 1 ? 's' : '' }} total
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="email in emails"
                  :key="email.id"
                  class="hover:bg-muted/50"
                >
                  <TableCell class="font-medium">
                    {{ email.filename }}
                  </TableCell>
                  <TableCell>
                    {{ email.subject || 'No subject' }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="email.analyzed ? 'default' : 'secondary'">
                      {{ email.analyzed ? 'Analyzed' : 'Pending' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground">
                    {{ formatDate(email.createdAt) }}
                  </TableCell>
                  <TableCell>
                    <NuxtLink :to="`/email/${email.id}`">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </NuxtLink>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="text-center py-12">
            <Icon name="lucide:inbox" class="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 class="mt-4 text-lg font-semibold">
              No emails yet
            </h3>
            <p class="mt-2 text-muted-foreground">
              Get started by uploading your first email for analysis.
            </p>
            <Button class="mt-4" @click="showUploadDialog = true">
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Upload Your First Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
