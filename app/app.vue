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
          <UploadEmailButton />
        </template>
      </UHeader>

      <UBanner
        v-if="updateAvailable"
        :id="`update-${updateAvailable.version}`"
        icon="i-lucide-download"
        :title="`Version ${updateAvailable.version} is available`"
        :to="updateAvailable.url"
        target="_blank"
        color="info"
        close
      />

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
const { checkBrowserInstalled, ensureBrowserInstalled } = useBrowserSetup()
const { updateAvailable, checkForUpdates } = useUpdateChecker()

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

// Check browser installation only once per app launch
// Use a flag stored in sessionStorage to prevent repeated checks
onMounted(async () => {
  // Check for updates in background
  checkForUpdates()
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
