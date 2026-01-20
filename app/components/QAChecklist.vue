<script lang="ts" setup>
import type { QAChecklistItem } from '@@/lib/db/schema/qaChecklist'

const props = defineProps<{
  items: QAChecklistItem[]
}>()

const emit = defineEmits<{
  update: [id: number, completed: boolean]
  updateNote: [id: number, note: string | null]
  resetAll: []
  markAllComplete: []
}>()

// Track which item is being edited for notes
const editingNoteId = ref<number | null>(null)
const noteText = ref<string>('')

// Calculate progress
const completedCount = computed(() => props.items.filter(item => item.completed).length)
const totalCount = computed(() => props.items.length)
const progressPercentage = computed(() =>
  totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0
)

// Handle checkbox toggle
function toggleItem(item: QAChecklistItem) {
  emit('update', item.id, !item.completed)
}

// Note handling
function startEditingNote(item: QAChecklistItem) {
  editingNoteId.value = item.id
  noteText.value = item.note || ''
}

function saveNote(item: QAChecklistItem) {
  const trimmedNote = noteText.value.trim()
  emit('updateNote', item.id, trimmedNote || null)
  editingNoteId.value = null
  noteText.value = ''
}

function cancelEditingNote() {
  editingNoteId.value = null
  noteText.value = ''
}

// Bulk actions
function handleResetAll() {
  emit('resetAll')
}

function handleMarkAllComplete() {
  emit('markAllComplete')
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">QA Checklist</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Manual QA validation checklist. Check off each item as you complete your quality assurance review.
          </p>
        </div>
        <UBadge
          :color="progressPercentage === 100 ? 'success' : 'neutral'"
          variant="subtle"
          size="lg"
          class="shrink-0"
        >
          {{ completedCount }}/{{ totalCount }} Complete ({{ progressPercentage }}%)
        </UBadge>
      </div>
    </template>

    <!-- Progress Bar -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-muted-foreground">Progress</span>
        <span class="text-sm font-medium">{{ progressPercentage }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          class="bg-primary h-full transition-all duration-300 ease-in-out"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </div>

    <!-- Checklist Items -->
    <div class="space-y-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="rounded-lg  transition-colors"
      >
        <!-- Item Row -->
        <div class="flex items-start gap-3 p-3 group">
          <!-- Checkbox -->
          <UCheckbox
            :model-value="item.completed"
            @update:model-value="toggleItem(item)"
            class="mt-0.5"
          />

          <!-- Item Text -->
          <div class="flex-1 min-w-0">
            <label
              :for="`item-${item.id}`"
              class="text-sm cursor-pointer select-none block"
              :class="{ 'line-through text-muted-foreground': item.completed }"
              @click="toggleItem(item)"
            >
              {{ item.itemText }}
            </label>

            <!-- Note Display -->
            <div v-if="item.note && editingNoteId !== item.id" class="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              {{ item.note }}
            </div>
          </div>

          <!-- Note Button -->
          <UButton
            :icon="item.note ? 'i-lucide-sticky-note' : 'i-lucide-message-square-plus'"
            variant="ghost"
            size="xs"
            :color="item.note ? 'primary' : 'neutral'"
            @click="startEditingNote(item)"
            v-if="editingNoteId !== item.id"
          />
        </div>

        <!-- Note Editor -->
        <div v-if="editingNoteId === item.id" class="px-3 pb-3 space-y-2 w-full">
          <div class="w-full">
          <UTextarea
            v-model="noteText"
            placeholder="Add a note..."
            :rows="3"
            autofocus
          />
          </div>
          <div class="flex items-center gap-2 justify-end">
            <UButton
              label="Cancel"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="cancelEditingNote"
            />
            <UButton
              label="Save"
              variant="soft"
              color="primary"
              size="xs"
              @click="saveNote(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-clipboard-list" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p class="text-sm text-muted-foreground">No checklist items available</p>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">
          {{ totalCount - completedCount }} items remaining
        </span>
        <div class="flex items-center gap-2">
          <UButton
            label="Reset All"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="handleResetAll"
            :disabled="completedCount === 0"
          />
          <UButton
            label="Mark All Complete"
            variant="soft"
            color="primary"
            size="sm"
            @click="handleMarkAllComplete"
            :disabled="completedCount === totalCount"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
