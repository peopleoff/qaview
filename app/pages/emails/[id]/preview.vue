<script lang="ts" setup>
const route = useRoute()
const db = useDatabase()
const toast = useToast()

const id = String(route.params.id)
const loading = ref(true)
const htmlContent = ref<string | null>(null)
const error = ref<string | null>(null)

// Fetch preview HTML on mount
onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const result = await db.getPreviewHtml(id)

    if (!result.success) {
      error.value = result.error
      toast.add({
        title: 'Error',
        description: result.error,
        color: 'error',
      })
      return
    }

    if (result.data) {
      htmlContent.value = result.data
    }
  } catch (err) {
    console.error('Failed to load preview:', err)
    error.value = 'Failed to load preview'
    toast.add({
      title: 'Error',
      description: 'Failed to load preview',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
})

function goBack() {
  navigateTo(`/emails/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-3 flex items-center justify-between print:hidden">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          @click="goBack"
        />
        <h1 class="text-lg font-semibold">Export Preview</h1>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-download"
          label="Export PDF"
          @click="goBack"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="pt-14">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="text-center">
          <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin mb-4" />
          <p class="text-gray-500">Loading preview...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center py-24">
        <div class="text-center">
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Failed to Load Preview</h3>
          <p class="text-gray-500 mb-4">{{ error }}</p>
          <UButton
            icon="i-lucide-arrow-left"
            label="Go Back"
            @click="goBack"
          />
        </div>
      </div>

      <!-- Preview Content -->
      <div v-else-if="htmlContent" class="preview-content">
        <iframe
          :srcdoc="htmlContent"
          class="w-full border-0"
          style="min-height: calc(100vh - 56px);"
          title="PDF Export Preview"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-content iframe {
  width: 100%;
  height: calc(100vh - 56px);
  background: white;
}
</style>
