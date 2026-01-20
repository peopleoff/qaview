<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const { ensureBrowserInstalled } = useBrowserSetup();

// Check browser installation only once per app launch
// Use a flag stored in sessionStorage to prevent repeated checks
onMounted(async () => {
  // Skip if we already checked this session
  if (sessionStorage.getItem('browser-check-done') === 'true') {
    return;
  }

  await ensureBrowserInstalled();

  // Mark as checked for this session
  sessionStorage.setItem('browser-check-done', 'true');
});
</script>
