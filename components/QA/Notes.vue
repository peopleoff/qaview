<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type QANote = {
  id: string;
  text: string;
  timestamp: number;
};

const props = defineProps<{
  emailId: number;
}>();

const notes = ref<QANote[]>([]);
const newNoteText = ref("");
const isEditing = ref(false);

const storageKey = computed(() => `qa-notes-${props.emailId}`);

// Load from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey.value);
  if (saved) {
    try {
      const savedNotes = JSON.parse(saved);
      notes.value = savedNotes;
    }
    catch (e) {
      console.error("Failed to load notes from localStorage:", e);
    }
  }
});

// Save to localStorage when notes change
watch(notes, (newNotes) => {
  localStorage.setItem(storageKey.value, JSON.stringify(newNotes));
}, { deep: true });

function addNote() {
  if (!newNoteText.value.trim()) {
    alert("Please enter note text.");
    return;
  }

  const note: QANote = {
    id: Date.now().toString(),
    text: newNoteText.value.trim(),
    timestamp: Date.now(),
  };

  notes.value.unshift(note); // Add to beginning of array

  // Reset form
  newNoteText.value = "";
  isEditing.value = false;
}

function deleteNote(id: string) {
  if (confirm("Are you sure you want to delete this note?")) {
    notes.value = notes.value.filter(note => note.id !== id);
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-primary">
              QA Notes
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <Badge
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {{ notes.length }} {{ notes.length === 1 ? 'Note' : 'Notes' }}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              @click="isEditing = !isEditing"
            >
              <Icon :name="isEditing ? 'lucide:x' : 'lucide:plus'" class="mr-2 h-4 w-4" />
              {{ isEditing ? 'Cancel' : 'Add Note' }}
            </Button>
          </div>
        </div>
      </CardTitle>
      <CardDescription>
        Leave notes and feedback for the QA review process. Document issues, observations, and recommendations.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Add Note Form -->
      <div v-if="isEditing" class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 class="text-lg font-medium mb-4">
          Add New Note
        </h3>
        <div class="space-y-4">
          <div>
            <label for="note-text" class="block text-sm font-medium mb-2">Note</label>
            <textarea
              id="note-text"
              v-model="newNoteText"
              rows="4"
              placeholder="Enter your QA note, feedback, or observations..."
              class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="isEditing = false">
              Cancel
            </Button>
            <Button @click="addNote">
              Add Note
            </Button>
          </div>
        </div>
      </div>

      <!-- Notes List -->
      <div v-if="notes.length > 0 || isEditing" class="space-y-4">
        <div
          v-for="note in notes"
          :key="note.id"
          class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs text-gray-500">{{ formatTimestamp(note.timestamp) }}</span>
            <Button
              variant="ghost"
              size="sm"
              class="text-red-600 hover:text-red-800 hover:bg-red-50"
              @click="deleteNote(note.id)"
            >
              <Icon name="lucide:trash-2" class="h-4 w-4" />
            </Button>
          </div>
          <div class="text-sm text-gray-700 whitespace-pre-wrap">
            {{ note.text }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <Icon name="lucide:sticky-note" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">
          No notes yet
        </h3>
        <p class="mt-2 text-gray-500">
          Add your first QA note to document observations and feedback.
        </p>
        <Button class="mt-4" @click="isEditing = true">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Add First Note
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
