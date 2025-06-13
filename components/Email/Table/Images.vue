<script setup lang="ts">
import type { Image } from "@/types/Email";

import { Badge } from "@/components/ui/badge";
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
  images: Image[];
}>();

const selectedImage = ref<string | null>(null);

function openImageModal(imageSrc: string) {
  selectedImage.value = imageSrc;
}

function closeImageModal() {
  selectedImage.value = null;
}
</script>

<template>
  <Table>
    <TableCaption>Images</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>
          Alt Text
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Dimensions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="image in images" :key="image.id">
        <TableCell class="font-medium truncate max-w-[200px]">
          {{ image.alt }}
        </TableCell>
        <TableCell class="font-medium">
          <Badge
            variant="outline"
            :class="(image?.status ?? 0) >= 200 && (image?.status ?? 0) < 300 ? 'bg-green-500' : 'bg-red-500'"
          >
            {{ image?.status ?? 'N/A' }}
          </Badge>
        </TableCell>
        <TableCell>{{ image.width }} × {{ image.height }}</TableCell>
        <TableCell>
          <img
            v-if="image.src"
            :src="image.src"
            alt="Screenshot"
            class="w-10 h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
            @click="openImageModal(image.src)"
          >
          <span v-else>N/A</span>
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
</template>
