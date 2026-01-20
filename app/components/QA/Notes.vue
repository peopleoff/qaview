<script setup lang="ts">
import type { QANote } from "@@/lib/db/schema";

const props = defineProps<{
  emailId: number;
}>();

const { getQANotes, createQANote, deleteQANote } = useDatabase();

const newNoteText = ref("");
const isEditing = ref(false);
const notes = ref<QANote[]>([]);
const isLoading = ref(true);
const noteTextarea = ref<HTMLTextAreaElement | null>(null);

async function loadNotes() {
  isLoading.value = true;
  const response = await getQANotes(props.emailId);
  if (response.success && response.data) {
    notes.value = response.data;
  }
  isLoading.value = false;
}

async function addNote() {
  if (!newNoteText.value.trim()) {
    return;
  }

  try {
    const response = await createQANote({
      emailId: props.emailId,
      text: newNoteText.value.trim(),
    });

    if (response.success) {
      await loadNotes();
      newNoteText.value = "";
      isEditing.value = false;
    } else {
      alert(`Failed to add note: ${response.error}`);
    }
  } catch (e) {
    console.error("Failed to add note:", e);
    alert("Failed to add note. Please try again.");
  }
}

async function removeNote(id: number) {
  try {
    const response = await deleteQANote(id);
    if (response.success) {
      await loadNotes();
    } else {
      alert(`Failed to delete note: ${response.error}`);
    }
  } catch (e) {
    console.error("Failed to delete note:", e);
    alert("Failed to delete note. Please try again.");
  }
}

function formatTimestamp(timestamp: Date): string {
  return new Date(timestamp).toLocaleString();
}

// Auto-focus textarea when editing mode opens
watch(isEditing, (newValue) => {
  if (newValue) {
    nextTick(() => {
      noteTextarea.value?.focus();
    });
  }
});

onMounted(() => {
  loadNotes();
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex-1">
          <h2 class="text-2xl font-semibold">
            QA Notes
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            Leave notes and feedback for the QA review process. Document issues, observations, and recommendations.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            size="sm"
            @click="isEditing = !isEditing"
          >
            <UIcon :name="isEditing ? 'i-heroicons-x-mark' : 'i-heroicons-plus'" class="mr-2" />
            {{ isEditing ? 'Cancel' : 'Add Note' }}
          </UButton>
        </div>
      </div>
    </template>

    <!-- Add Note Form -->
    <div v-if="isEditing" class="space-y-3">
      <UTextarea
        ref="noteTextarea"
        v-model="newNoteText"
        :rows="4"
        placeholder="Enter your QA note, feedback, or observations..."
        autofocus
        class="w-full"
      />
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="isEditing = false">
          Cancel
        </UButton>
        <UButton @click="addNote" :disabled="!newNoteText.trim()">
          Add Note
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="!isEditing && isLoading" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="mx-auto h-8 w-8 text-gray-400 animate-spin" />
      <p class="mt-2 text-gray-500">Loading notes...</p>
    </div>

    <!-- Notes List -->
    <div v-else-if="!isEditing && notes.length > 0" class="space-y-4">
      <div
        v-for="note in notes"
        :key="note.id"
        class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div class="flex items-start justify-between mb-3">
          <span class="text-xs text-gray-500">{{ formatTimestamp(note.createdAt) }}</span>
          <UButton
            variant="ghost"
            size="xs"
            color="error"
            @click="removeNote(note.id)"
          >
            <UIcon name="i-heroicons-trash" />
          </UButton>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {{ note.text }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isEditing && !isLoading" class="text-center py-6 text-gray-500 text-sm">
      No notes yet
    </div>
  </UCard>
</template>
