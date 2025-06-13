<script setup lang="ts">
import type { CreateQaNote } from "~/lib/validations";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createQaNoteSchema,
} from "~/lib/validations";

const props = defineProps<{
  emailId: number;
}>();

const newNoteText = ref("");
const isEditing = ref(false);

const { data: notes, refresh } = useLazyAsyncData(`notes-${props.emailId}`, () => $fetch(`/api/email/${props.emailId}/qa-notes`), {
  server: false,
});

async function addNote() {
  try {
    // Validate the note text before sending
    const validatedData: CreateQaNote = createQaNoteSchema.parse({
      text: newNoteText.value.trim(),
    });

    await $fetch(`/api/email/${props.emailId}/qa-notes`, {
      method: "POST",
      body: validatedData,
    });

    refresh();

    // Reset form
    newNoteText.value = "";
    isEditing.value = false;
  }
  catch (e) {
    console.error("Failed to add note:", e);
    if (e instanceof Error) {
      alert(`Failed to add note: ${e.message}`);
    }
    else {
      alert("Failed to add note. Please try again.");
    }
  }
}

async function deleteNote(id: number) {
  try {
    await $fetch(`/api/email/${props.emailId}/qa-notes/${id}`, {
      method: "DELETE",
    });
    refresh();
  }
  catch (e) {
    console.error("Failed to delete note:", e);
    alert("Failed to delete note. Please try again.");
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
              {{ notes?.length }} {{ notes?.length === 1 ? 'Note' : 'Notes' }}
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
      <div v-if="isEditing" class="mb-6 p-4 border border-accent rounded-lg bg-accent">
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
      <div v-if="notes && (notes.length > 0 || isEditing)" class="space-y-4">
        <div
          v-for="note in notes"
          :key="note.id"
          class="p-4 border border-accent rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs text-muted-foreground">{{ formatTimestamp(note.createdAt) }}</span>
            <ConfirmDialog
              title="Delete Note"
              description="This action cannot be undone. This will permanently delete the note."
              confirm-text="Delete"
              @confirm="deleteNote(note.id)"
            >
              <template #trigger>
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </template>
            </ConfirmDialog>
          </div>
          <div class="text-sm text-muted-foreground whitespace-pre-wrap">
            {{ note.text }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <Icon name="lucide:sticky-note" class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-4 text-lg font-medium text-muted-foreground">
          No notes yet
        </h3>
        <p class="mt-2 text-muted-foreground">
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
