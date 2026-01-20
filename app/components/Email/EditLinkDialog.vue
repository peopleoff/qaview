<script setup lang="ts">
import type { Link } from '@@/lib/db/schema/links'

interface Props {
  open: boolean
  link: Link | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated', link: Link): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const db = useDatabase()
const toast = useToast()

const form = ref({
  text: '',
  url: '',
  finalUrl: '',
  status: 0,
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const screenshotPreview = ref<string | null>(null)

// Watch for link changes to populate form
watch(() => props.link, async (newLink) => {
  if (newLink) {
    form.value = {
      text: newLink.text || '',
      url: newLink.url || '',
      finalUrl: newLink.finalUrl || '',
      status: newLink.status || 0,
    }
    errors.value = {}

    // Load screenshot preview if exists
    if (newLink.screenshotPath) {
      const result = await db.getImageData(newLink.screenshotPath)
      if (result.success) {
        screenshotPreview.value = result.data ?? null
      } else {
        screenshotPreview.value = null
      }
    } else {
      screenshotPreview.value = null
    }
  }
}, { immediate: true })

function closeDialog() {
  emit('update:open', false)
  errors.value = {}
}

function validateForm(): boolean {
  errors.value = {}

  if (!form.value.text.trim()) {
    errors.value.text = 'Link text is required'
  }

  if (form.value.url && !isValidUrl(form.value.url)) {
    errors.value.url = 'Must be a valid URL'
  }

  if (form.value.finalUrl && !isValidUrl(form.value.finalUrl)) {
    errors.value.finalUrl = 'Must be a valid URL'
  }

  if (form.value.status < 0 || form.value.status > 599) {
    errors.value.status = 'Status must be between 0 and 599'
  }

  return Object.keys(errors.value).length === 0
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

async function handleSubmit() {
  if (!props.link) return
  if (!validateForm()) return

  try {
    isSubmitting.value = true

    const result = await db.updateLink(props.link.id, {
      text: form.value.text,
      url: form.value.url || null,
      finalUrl: form.value.finalUrl || null,
      status: form.value.status || null,
      isEdited: 1,
    })

    if (result.success && result.data) {
      emit('updated', result.data)
      toast.add({
        title: 'Success',
        description: 'Link updated successfully',
        color: 'success',
      })
      closeDialog()
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update link',
        color: 'error',
      })
    }
  } catch (error) {
    console.error('Failed to update link:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update link',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold">Edit Link</h3>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          size="sm"
          @click="closeDialog"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Link Text" :error="errors.text">
          <UInput
            v-model="form.text"
            placeholder="Enter link text"
          />
        </UFormField>

        <UFormField label="Original URL" :error="errors.url">
          <UInput
            v-model="form.url"
            placeholder="Enter original URL"
          />
        </UFormField>

        <UFormField label="Final URL" :error="errors.finalUrl">
          <UInput
            v-model="form.finalUrl"
            placeholder="Enter final URL (after redirects)"
          />
        </UFormField>

        <UFormField label="Status Code" :error="errors.status">
          <UInput
            v-model.number="form.status"
            type="number"
            placeholder="HTTP status code"
            min="0"
            max="599"
          />
        </UFormField>

        <!-- Screenshot Preview -->
        <div v-if="screenshotPreview" class="space-y-2">
          <label class="text-sm font-medium">Current Screenshot</label>
          <img
            :src="screenshotPreview"
            alt="Link destination screenshot"
            class="max-w-full h-32 object-contain border rounded-lg"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          @click="closeDialog"
        >
          Cancel
        </UButton>
        <UButton
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          Save Changes
        </UButton>
      </div>
    </template>
  </UModal>
</template>
