<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SpellError = {
  id: number;
  word: string;
  position: number;
  suggestions: string;
  context: string;
  emailId: number;
  createdAt: number;
  updatedAt: number;
};

const props = defineProps<{
  spellErrors: SpellError[];
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const deletingErrors = ref<Set<number>>(new Set());
const addingToDict = ref<Set<number>>(new Set());

function getSuggestions(suggestionsJson: string): string[] {
  try {
    return JSON.parse(suggestionsJson);
  }
  catch {
    return [];
  }
}
function getSpellingStats() {
  if (props.spellErrors.length === 0) {
    return { status: "Perfect", color: "bg-green-100 text-green-800" };
  }
  else if (props.spellErrors.length <= 5) {
    return { status: "Good", color: "bg-yellow-100 text-yellow-800" };
  }
  else {
    return { status: "Needs Review", color: "bg-red-100 text-red-800" };
  }
}

async function deleteError(errorId: number) {
  deletingErrors.value.add(errorId);

  try {
    await $fetch(`/api/spell-error/${errorId}`, {
      method: "DELETE",
    });

    // Emit refresh to parent to reload data
    emit("refresh");
  }
  catch (error) {
    console.error("Failed to delete spell error:", error);
  }
  finally {
    deletingErrors.value.delete(errorId);
  }
}

async function addToCustomDictionary(word: string, errorId: number) {
  addingToDict.value.add(errorId);

  try {
    await $fetch("/api/custom-dictionary", {
      method: "POST",
      body: { word },
    });

    // Delete the error from the database
    await deleteError(errorId);
    // Emit refresh to parent to reload data
    emit("refresh");
  }
  catch (error) {
    console.error("Failed to add word to custom dictionary:", error);
  }
  finally {
    addingToDict.value.delete(errorId);
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary Badge -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <Badge class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" :class="getSpellingStats().color">
          <Icon name="lucide:spell-check" class="mr-2 h-4 w-4" />
          {{ getSpellingStats().status }}
        </Badge>
        <span class="text-sm text-muted-foreground">
          {{ spellErrors.length }} {{ spellErrors.length === 1 ? 'error' : 'errors' }} found
        </span>
      </div>
    </div>

    <!-- Errors Table -->
    <Table v-if="spellErrors.length > 0">
      <TableCaption>Spelling and Grammar Errors</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Misspelled Word</TableHead>
          <TableHead>Context</TableHead>
          <TableHead>Suggestions</TableHead>
          <TableHead class="w-[120px]">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="error in spellErrors" :key="error.id">
          <TableCell class="font-medium">
            <code class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
              {{ error.word }}
            </code>
          </TableCell>
          <TableCell class="max-w-[300px]">
            <div class="text-sm text-muted-foreground">
              <span class="truncate block">
                {{ error.context }}
              </span>
            </div>
          </TableCell>
          <TableCell class="max-w-[200px]">
            <div class="text-sm">
              <div class="space-y-1">
                <div
                  v-for="suggestion in getSuggestions(error.suggestions)"
                  :key="suggestion"
                  class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 mb-1"
                >
                  {{ suggestion }}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div class="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                :disabled="addingToDict.has(error.id)"
                title="Add to dictionary"
                @click="addToCustomDictionary(error.word, error.id)"
              >
                <Icon
                  :name="addingToDict.has(error.id) ? 'lucide:loader-2' : 'lucide:plus'"
                  :class="addingToDict.has(error.id) ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                :disabled="deletingErrors.has(error.id)"
                title="Delete error"
                @click="deleteError(error.id)"
              >
                <Icon
                  :name="deletingErrors.has(error.id) ? 'lucide:loader-2' : 'lucide:x'"
                  :class="deletingErrors.has(error.id) ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
                />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- No Errors State -->
    <div v-else class="text-center py-8">
      <Icon name="lucide:check-circle" class="mx-auto h-12 w-12 text-green-500" />
      <h3 class="mt-4 text-lg font-medium text-muted-foreground">
        Perfect Spelling!
      </h3>
      <p class="mt-2 text-muted-foreground">
        No spelling or grammar errors were found in this email.
      </p>
    </div>
  </div>
</template>
