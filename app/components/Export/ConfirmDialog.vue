<script setup lang="ts">
import type { QAChecklistItem } from '@@/lib/db/schema/qaChecklist'

interface Props {
  open: boolean
  incompleteItems: QAChecklistItem[]
  totalChecklistItems: number
  hasSendLogs: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function closeDialog() {
  emit('update:open', false)
}

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <div class="flex items-center gap-3 w-full">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 class="text-lg font-semibold">Incomplete QA Review</h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          The following items need attention before exporting:
        </p>

        <ul class="space-y-2">
          <li v-if="incompleteItems.length > 0" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
            <UIcon name="i-lucide-circle-x" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{{ incompleteItems.length }} of {{ totalChecklistItems }} QA checklist items incomplete</span>
          </li>
          <li v-if="!hasSendLogs" class="flex items-start gap-2 text-gray-700 dark:text-gray-300">
            <UIcon name="i-lucide-circle-x" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>No send logs attached</span>
          </li>
        </ul>

        <p class="text-gray-600 dark:text-gray-400 pt-2">
          Are you sure you want to export anyway?
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="soft"
          color="neutral"
          @click="handleConfirm"
        >
          Export Anyway
        </UButton>
        <UButton
          @click="closeDialog"
        >
          Cancel
        </UButton>
      </div>
    </template>
  </UModal>
</template>
