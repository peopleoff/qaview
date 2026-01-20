<script setup lang="ts">
defineProps<{
  label?: string
}>()

const db = useDatabase()
const toast = useToast()

async function handleUpload() {
  const selectResult = await db.selectFile()
  if (!selectResult.success || !selectResult.data) return

  const uploadResult = await db.uploadEmail(selectResult.data)
  if (uploadResult.success) {
    toast.add({
      title: 'Success',
      description: uploadResult.message,
      color: 'success'
    })
    await navigateTo(`/emails/${uploadResult.emailId}`)
  } else {
    toast.add({
      title: 'Error',
      description: uploadResult.error || 'Failed to upload email',
      color: 'error'
    })
  }
}
</script>

<template>
  <UButton
    icon="i-lucide-upload"
    :label="label ?? 'Upload Email'"
    @click="handleUpload"
  />
</template>
