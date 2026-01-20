<template>
  <UApp>
    <!-- Only show header on main app pages, not setup wizard -->
    <template v-if="route.path !== '/setup'">
      <UHeader :toggle="false" :ui="{ center: 'flex' }">
        <template #title>
          <NuxtLink to="/" class="flex items-center gap-2">
            <UIcon name="i-lucide-mail-check" class="w-6 h-6 text-primary" />
            <span class="font-bold text-xl">QAView</span>
          </NuxtLink>
        </template>

        <UBreadcrumb :items="breadcrumbs" />

        <template #right>
          <UButton
            icon="i-lucide-upload"
            label="Upload Email"
            @click="handleUpload"
          />
        </template>
      </UHeader>

      <UMain>
        <UContainer class="py-8">
          <NuxtPage />
        </UContainer>
      </UMain>
    </template>

    <!-- Setup wizard has its own layout -->
    <template v-else>
      <NuxtPage />
    </template>
  </UApp>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const db = useDatabase()
const toast = useToast()
const { checkBrowserInstalled, ensureBrowserInstalled } = useBrowserSetup()

// Dynamic breadcrumbs based on current route
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: 'Emails', icon: 'i-lucide-inbox', to: '/' }
  ]

  if (route.name === 'emails-id') {
    items.push({ label: `Email #${route.params.id}`, icon: 'i-lucide-mail' })
  }

  if (route.name === 'emails-id-preview') {
    items.push(
      { label: `Email #${route.params.id}`, icon: 'i-lucide-mail', to: `/emails/${route.params.id}` },
      { label: 'Preview', icon: 'i-lucide-eye' }
    )
  }

  return items
})

// Handle email upload from header
async function handleUpload() {
  const selectResult = await db.selectFile()
  if (selectResult.success && selectResult.data) {
    const uploadResult = await db.uploadEmail(selectResult.data)
    if (uploadResult.success) {
      toast.add({
        title: 'Success',
        description: uploadResult.message,
        color: 'success'
      })
      // Redirect to the newly uploaded email
      await navigateTo(`/emails/${uploadResult.emailId}`)
    } else {
      toast.add({
        title: 'Error',
        description: uploadResult.error || 'Failed to upload email',
        color: 'error'
      })
    }
  }
}

// Check browser installation only once per app launch
// Use a flag stored in sessionStorage to prevent repeated checks
onMounted(async () => {
  // Skip if we already checked this session
  if (sessionStorage.getItem('browser-check-done') === 'true') {
    return
  }

  // Only set flag if browser is actually installed
  // If not installed, ensureBrowserInstalled will redirect to /setup
  // and /setup will handle marking completion after download
  const isInstalled = await checkBrowserInstalled()
  if (isInstalled) {
    sessionStorage.setItem('browser-check-done', 'true')
  } else {
    await ensureBrowserInstalled()
    // Don't set flag - /setup page will handle completion
  }
})
</script>
