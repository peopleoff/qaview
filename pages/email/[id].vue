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

const { id } = useRoute().params;

const { data: emailData, refresh } = useAsyncData("email", () => $fetch(`/api/email/${id}`));

const isExporting = ref(false);
const activeTab = ref("desktop");

async function analyzeEmail() {
  try {
    await $fetch(`/api/email/${id}/analyze`);
    refresh();
  }
  catch (e) {
    console.error(e);
  }
};

async function exportPDF() {
  if (!emailData.value?.analyzed) {
    alert("Please analyze the email before exporting.");
    return;
  }

  isExporting.value = true;
  try {
    const downloadUrl = `/api/email/${id}/export`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `email-${id}-qa-report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  catch (e) {
    console.error("Export failed:", e);
    alert("Failed to export PDF. Please try again.");
  }
  finally {
    // Reset loading state after download should have started
    setTimeout(() => {
      isExporting.value = false;
    }, 1500);
  }
};
</script>

<template>
  <div v-if="emailData" class="bg-background py-8 px-4 sm:px-6 lg:px-8 space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 class="text-2xl font-semibold text-primary">
                Summary
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <Badge
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="[
                  emailData.analyzed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800',
                ]"
              >
                {{ emailData.analyzed ? 'Analyzed' : 'Pending Analysis' }}
              </Badge>
              <Button v-if="!emailData.analyzed" @click="analyzeEmail">
                Analyze
              </Button>
              <Button
                v-if="emailData.analyzed"
                :is-loading="isExporting"
                @click="exportPDF"
              >
                {{ isExporting ? 'Exporting...' : 'Export PDF' }}
              </Button>
            </div>
          </div>
        </CardTitle>
        <CardDescription>Last updated: {{ new Date(emailData.updatedAt).toLocaleString() }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">
              Subject
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.subject || 'No subject' }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">
              Links
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.links.length }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">
              Images
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.images.length }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">
              Sendlogs
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.sendlogAttachments?.length || 0 }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">
              Spelling
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.spellErrors?.length || 0 }} errors
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Desktop and mobile preview of the email</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="emailData.screenshotDesktopUrl || emailData.screenshotMobileUrl" class="space-y-6">
          <!-- Desktop and Mobile Toggle Tabs -->
          <div class="flex border-b border-gray-200">
            <button
              class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
              :class="activeTab === 'desktop' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              @click="activeTab = 'desktop'"
            >
              <Icon name="lucide:monitor" class="mr-2 h-4 w-4 inline" />
              Desktop (800px)
            </button>
            <button
              class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
              :class="activeTab === 'mobile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              @click="activeTab = 'mobile'"
            >
              <Icon name="lucide:smartphone" class="mr-2 h-4 w-4 inline" />
              Mobile (375px)
            </button>
          </div>

          <!-- Desktop Preview -->
          <div v-if="activeTab === 'desktop' && emailData.screenshotDesktopUrl" class="text-center">
            <img
              :src="emailData.screenshotDesktopUrl"
              alt="Desktop Email Preview"
              class="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm mx-auto"
            >
          </div>

          <!-- Mobile Preview -->
          <div v-if="activeTab === 'mobile' && emailData.screenshotMobileUrl" class="text-center">
            <img
              :src="emailData.screenshotMobileUrl"
              alt="Mobile Email Preview"
              class="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm mx-auto"
              style="max-width: 375px;"
            >
          </div>

          <!-- Fallback to legacy screenshot -->
          <div v-if="!emailData.screenshotDesktopUrl && !emailData.screenshotMobileUrl && emailData.screenshotUrl" class="text-center">
            <img
              :src="emailData.screenshotUrl"
              alt="Email Preview"
              class="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm mx-auto"
            >
          </div>
        </div>

        <div v-else class="text-center py-8">
          <Icon name="lucide:image-off" class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-gray-500">
            No screenshot available
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
        <CardDescription>Links Analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <EmailTableLinks :links="emailData.links" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>Images Analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <EmailTableImages :images="emailData.images" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Spelling & Grammar</CardTitle>
        <CardDescription>Spell Check Analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <EmailTableSpellCheck :spell-errors="emailData.spellErrors || []" @refresh="refresh" />
      </CardContent>
    </Card>
    <QAChecklist :email-id="Number(id)" />
    <EmailSendlogAttachments :email-id="Number(id)" @refresh="refresh" />
    <QANotes :email-id="Number(id)" />
  </div>
</template>
