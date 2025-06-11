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
    isExporting.value = false;
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
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500">
              Subject
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.subject || 'No subject' }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">
              Links
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.links.length }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">
              Images
            </h3>
            <p class="mt-1 text-lg font-medium text-primary">
              {{ emailData.images.length }}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">
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
        <CardDescription>Preview of the email</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-center">
          <img
            v-if="emailData.screenshotUrl"
            :src="emailData.screenshotUrl"
            alt="Email Preview"
            class="w-full h-auto"
          >
          <div v-else>
            <p>No screenshot available</p>
          </div>
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
        <EmailTableSpellCheck :spell-errors="emailData.spellErrors || []" />
      </CardContent>
    </Card>
    <QAChecklist :email-id="Number(id)" />
    <QANotes :email-id="Number(id)" />
  </div>
</template>
