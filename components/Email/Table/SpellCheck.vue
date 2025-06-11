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

const expandedErrors = ref<Set<number>>(new Set());

function toggleExpanded(errorId: number) {
  if (expandedErrors.value.has(errorId)) {
    expandedErrors.value.delete(errorId);
  }
  else {
    expandedErrors.value.add(errorId);
  }
}

function getSuggestions(suggestionsJson: string): string[] {
  try {
    return JSON.parse(suggestionsJson);
  }
  catch {
    return [];
  }
}

function formatSuggestions(suggestions: string[]): string {
  if (suggestions.length === 0)
    return "No suggestions";
  if (suggestions.length <= 3)
    return suggestions.join(", ");
  return `${suggestions.slice(0, 3).join(", ")} (+${suggestions.length - 3} more)`;
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
          <TableHead>Actions</TableHead>
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
            <div class="text-sm text-gray-700">
              <span v-if="!expandedErrors.has(error.id)" class="truncate block">
                {{ error.context }}
              </span>
              <span v-else class="whitespace-normal">
                {{ error.context }}
              </span>
            </div>
          </TableCell>
          <TableCell class="max-w-[200px]">
            <div class="text-sm">
              <span v-if="!expandedErrors.has(error.id)">
                {{ formatSuggestions(getSuggestions(error.suggestions)) }}
              </span>
              <div v-else class="space-y-1">
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
            <Button
              variant="ghost"
              size="sm"
              class="h-8"
              @click="toggleExpanded(error.id)"
            >
              <Icon
                :name="expandedErrors.has(error.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                class="h-4 w-4"
              />
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- No Errors State -->
    <div v-else class="text-center py-8">
      <Icon name="lucide:check-circle" class="mx-auto h-12 w-12 text-green-500" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">
        Perfect Spelling!
      </h3>
      <p class="mt-2 text-gray-500">
        No spelling or grammar errors were found in this email.
      </p>
    </div>
  </div>
</template>
