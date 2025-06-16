<script lang="ts" setup>
const { id } = useRoute().params;

// Fetch the preview HTML from the API
const { data: previewHtml, error } = await useFetch(`/api/email/${id}/preview`, {
  server: false,
  transform: (data: any) => data,
});

// Handle errors
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || "Failed to load preview",
  });
}

// Set page meta
useSeoMeta({
  title: `Email Preview - ${id}`,
});
</script>

<template>
  <div class="preview-container">
    <div v-if="previewHtml" v-html="previewHtml" />
    <div v-else class="loading">
      Loading preview...
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  min-height: 100vh;
  background: white;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  font-size: 1.2rem;
  color: #666;
}
</style>