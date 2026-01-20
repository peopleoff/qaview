<script setup lang="ts">
import type { Image } from '@@/lib/db/schema/images'

interface Props {
  open: boolean
  image: Image | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated', image: Image): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const db = useDatabase()
const toast = useToast()

const form = ref({
  alt: '',
  src: '',
  width: 0,
  height: 0,
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// Watch for image changes to populate form
watch(() => props.image, (newImage) => {
  if (newImage) {
    form.value = {
      alt: newImage.alt || '',
      src: newImage.src || '',
      width: newImage.width || 0,
      height: newImage.height || 0,
    }
    errors.value = {}
  }
}, { immediate: true })

function closeDialog() {
  emit('update:open', false)
  errors.value = {}
}

function validateForm(): boolean {
  errors.value = {}

  if (!form.value.alt.trim()) {
    errors.value.alt = 'Alt text is required'
  }

  if (form.value.src && !isValidUrl(form.value.src)) {
    errors.value.src = 'Must be a valid URL'
  }

  if (form.value.width && form.value.width < 1) {
    errors.value.width = 'Width must be greater than 0'
  }

  if (form.value.height && form.value.height < 1) {
    errors.value.height = 'Height must be greater than 0'
  }

  return Object.keys(errors.value).length === 0
}

function isValidUrl(string: string): boolean {
  // Allow data URLs
  if (string.startsWith('data:')) return true
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

async function handleSubmit() {
  if (!props.image) return
  if (!validateForm()) return

  try {
    isSubmitting.value = true

    const result = await db.updateImage(props.image.id, {
      alt: form.value.alt,
      src: form.value.src || null,
      width: form.value.width || null,
      height: form.value.height || null,
      isEdited: 1,
    })

    if (result.success && result.data) {
      emit('updated', result.data)
      toast.add({
        title: 'Success',
        description: 'Image updated successfully',
        color: 'success',
      })
      closeDialog()
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update image',
        color: 'error',
      })
    }
  } catch (error) {
    console.error('Failed to update image:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update image',
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
        <h3 class="text-lg font-semibold">Edit Image</h3>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          size="sm"
          @click="closeDialog"
        />
      </div>
    </template>

    <div class="space-y-4 p-4">
      <UFormField label="Alt Text" :error="errors.alt">
        <UInput
          v-model="form.alt"
          placeholder="Enter alt text"
        />
      </UFormField>

      <UFormField label="Source URL" :error="errors.src">
        <UInput
          v-model="form.src"
          placeholder="Enter image URL"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Width" :error="errors.width">
          <UInput
            v-model.number="form.width"
            type="number"
            placeholder="Width"
            min="1"
          />
        </UFormField>

        <UFormField label="Height" :error="errors.height">
          <UInput
            v-model.number="form.height"
            type="number"
            placeholder="Height"
            min="1"
          />
        </UFormField>
      </div>

      <!-- Image Preview -->
      <div v-if="image?.src" class="space-y-2">
        <label class="text-sm font-medium">Current Image</label>
        <img
          :src="image.src"
          :alt="image.alt || 'Image preview'"
          class="max-w-full h-32 object-contain border rounded-lg"
        />
      </div>
    </div>

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
