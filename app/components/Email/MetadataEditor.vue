<script setup lang="ts">
import type { Email } from '@@/lib/db/schema/emails'

interface Props {
  open: boolean
  email: Email | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated', email: Email): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const db = useDatabase()
const toast = useToast()

const form = ref({
  emailId: '',
  subject: '',
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// Watch for email changes to populate form
watch(() => props.email, (newEmail) => {
  if (newEmail) {
    form.value = {
      emailId: newEmail.emailId || '',
      subject: newEmail.subject || '',
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
  // No strict validation - fields are optional
  return true
}

async function handleSubmit() {
  if (!props.email) return
  if (!validateForm()) return

  try {
    isSubmitting.value = true

    const result = await db.updateEmail(props.email.id, {
      emailId: form.value.emailId || null,
      subject: form.value.subject || null,
    })

    if (!result.success) {
      toast.add({
        title: 'Error',
        description: result.error,
        color: 'error',
      })
      return
    }

    if (result.data) {
      emit('updated', result.data)
      toast.add({
        title: 'Success',
        description: 'Email metadata updated successfully',
        color: 'success',
      })
      closeDialog()
    }
  } catch (error) {
    console.error('Failed to update metadata:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update metadata',
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
        <h3 class="text-lg font-semibold">Edit Email Metadata</h3>
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
        <UFormField label="Email ID" :error="errors.emailId" hint="Used for tracking and PDF export naming">
          <UInput
            v-model="form.emailId"
            placeholder="e.g., campaign-2024-winter"
          />
        </UFormField>

        <UFormField label="Subject" :error="errors.subject">
          <UInput
            v-model="form.subject"
            placeholder="Email subject line"
          />
        </UFormField>
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
