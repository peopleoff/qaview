<script setup lang="ts">
import type { Link } from "@/types/Email";

import EditLinkDialog from "@/components/Email/EditLinkDialog.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

defineProps<{
  links: Link[];
}>();

const emit = defineEmits<{
  (e: "linkUpdated"): void;
}>();

const selectedImage = ref<string | null>(null);
const editDialogOpen = ref(false);
const editingLink = ref<Link | null>(null);

function openImageModal(imageSrc: string) {
  selectedImage.value = imageSrc;
}

function closeImageModal() {
  selectedImage.value = null;
}

function edit(link: Link) {
  editingLink.value = link;
  editDialogOpen.value = true;
}

function handleLinkUpdated() {
  emit("linkUpdated");
}
</script>

<template>
  <Table>
    <TableCaption>Links</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>
          Text
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead>utm_medium</TableHead>
        <TableHead>utm_campaign</TableHead>
        <TableHead>utm_source</TableHead>
        <TableHead>utm_content</TableHead>
        <TableHead>screenshot</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="link in links"
        :key="link.id"
        class="relative group"
      >
        <TableCell class="font-medium truncate max-w-[200px]">
          <div class="flex items-center gap-2">
            {{ link.text ? link.text : link.finalUrl }}
            <Badge
              v-if="link.isEdited"
              variant="secondary"
              class="text-xs"
            >
              Edited
            </Badge>
          </div>
        </TableCell>
        <TableCell class="font-medium">
          <Badge variant="outline" :class="(link?.status ?? 0) >= 200 && (link?.status ?? 0) < 300 ? 'bg-green-500' : 'bg-red-500'">
            {{ link?.status ?? 'N/A' }}
          </Badge>
        </TableCell>
        <TableCell>{{ link.utmParams?.utm_medium }}</TableCell>
        <TableCell>{{ link.utmParams?.utm_campaign }}</TableCell>
        <TableCell>{{ link.utmParams?.utm_source }}</TableCell>
        <TableCell>{{ link.utmParams?.utm_content }}</TableCell>
        <TableCell>
          <img
            :src="`/uploads/analysis/email-${link.emailId}/${link.screenshotPath}`"
            alt="Screenshot"
            class="w-10 h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
            @click="openImageModal(`/uploads/analysis/email-${link.emailId}/${link.screenshotPath}`)"
          >
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="icon"
            class="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            @click="edit(link)"
          >
            <Icon name="mdi:pencil" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <!-- Full-screen image modal -->
  <div
    v-if="selectedImage"
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    @click="closeImageModal"
  >
    <div class="relative max-w-[90vw] max-h-[90vh] p-4">
      <button
        class="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-black hover:bg-gray-200 z-10"
        @click="closeImageModal"
      >
        ×
      </button>
      <img
        :src="selectedImage"
        alt="Full size screenshot"
        class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        @click.stop
      >
    </div>
  </div>

  <!-- Edit Link Dialog -->
  <EditLinkDialog
    v-model:open="editDialogOpen"
    :link="editingLink"
    @updated="handleLinkUpdated"
  />
</template>
