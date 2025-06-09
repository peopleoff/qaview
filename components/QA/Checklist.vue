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

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  note?: string;
};

const props = defineProps<{
  emailId: number;
}>();

const checklistItems = ref<ChecklistItem[]>([
  {
    id: "figma-design",
    text: "Does every client design match figma design",
    completed: false,
    note: "",
  },
  {
    id: "url-validation",
    text: "Does every url work and do they go to the expected place",
    completed: false,
    note: "",
  },
  {
    id: "utm-parameters",
    text: "Are UTM's populating with the expected parameters",
    completed: false,
    note: "",
  },
  {
    id: "personalization",
    text: "Is all personalization correct",
    completed: false,
    note: "",
  },
  {
    id: "automation-documentation",
    text: "Document each step of the automation and journey, what it's doing and the expected results",
    completed: false,
    note: "",
  },
  {
    id: "developer-comments",
    text: "Ensure that developer is documenting their work with comments",
    completed: false,
    note: "",
  },
  {
    id: "send-log-validation",
    text: "Validate the SMS/Email send log and ensure that confirmationNumber, SubKey, raNumber, email/SMS name/id, and brand is being logged",
    completed: false,
    note: "",
  },
  {
    id: "documentation-screenshots",
    text: "Document all these steps, add screenshots if applicable",
    completed: false,
    note: "",
  },
]);

const completedCount = computed(() =>
  checklistItems.value.filter(item => item.completed).length,
);

const totalCount = computed(() => checklistItems.value.length);

const progressPercentage = computed(() =>
  Math.round((completedCount.value / totalCount.value) * 100),
);

const storageKey = computed(() => `qa-checklist-${props.emailId}`);

// Load from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey.value);
  if (saved) {
    try {
      const savedItems = JSON.parse(saved);
      checklistItems.value = savedItems;
    }
    catch (e) {
      console.error("Failed to load checklist from localStorage:", e);
    }
  }
});

// Save to localStorage when items change
watch(checklistItems, (newItems) => {
  localStorage.setItem(storageKey.value, JSON.stringify(newItems));
}, { deep: true });

const editingNoteId = ref<string | null>(null);
const tempNoteText = ref("");

function toggleItem(id: string) {
  const item = checklistItems.value.find(item => item.id === id);
  if (item) {
    item.completed = !item.completed;
  }
}

function startEditingNote(item: ChecklistItem) {
  editingNoteId.value = item.id;
  tempNoteText.value = item.note || "";
}

function saveNote(id: string) {
  const item = checklistItems.value.find(item => item.id === id);
  if (item) {
    item.note = tempNoteText.value.trim();
  }
  editingNoteId.value = null;
  tempNoteText.value = "";
}

function cancelNote() {
  editingNoteId.value = null;
  tempNoteText.value = "";
}

function deleteNote(id: string) {
  const item = checklistItems.value.find(item => item.id === id);
  if (item) {
    item.note = "";
  }
}

function resetChecklist() {
  checklistItems.value.forEach((item) => {
    item.completed = false;
    item.note = "";
  });
}

function markAllComplete() {
  checklistItems.value.forEach((item) => {
    item.completed = true;
  });
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-primary">
              QA Checklist
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <Badge
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              :class="[
                progressPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800',
              ]"
            >
              {{ completedCount }}/{{ totalCount }} Complete ({{ progressPercentage }}%)
            </Badge>
          </div>
        </div>
      </CardTitle>
      <CardDescription>
        Manual QA validation checklist. Check off each item as you complete your quality assurance review.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
      </div>

      <!-- Checklist Items -->
      <div class="space-y-4">
        <div
          v-for="item in checklistItems"
          :key="item.id"
          class="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-green-50 border-green-200': item.completed }"
        >
          <!-- Main Item Row -->
          <div class="flex items-start space-x-3">
            <div class="flex items-center h-5">
              <input
                :id="item.id"
                type="checkbox"
                :checked="item.completed"
                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                @change="toggleItem(item.id)"
              >
            </div>
            <div class="flex-1">
              <label
                :for="item.id"
                class="text-sm font-medium text-gray-900 cursor-pointer"
                :class="{ 'line-through text-gray-500': item.completed }"
              >
                {{ item.text }}
              </label>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
              <!-- Note Button -->
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                :class="{ 'text-blue-600': item.note }"
                @click="startEditingNote(item)"
              >
                <Icon name="lucide:sticky-note" class="h-4 w-4" />
              </Button>
              <!-- Completed Icon -->
              <div v-if="item.completed" class="flex-shrink-0">
                <Icon name="lucide:check-circle" class="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <!-- Existing Note Display -->
          <div v-if="item.note && editingNoteId !== item.id" class="mt-3 ml-7">
            <div class="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
              <div class="flex items-start justify-between">
                <div class="flex-1 whitespace-pre-wrap">
                  {{ item.note }}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-6 w-6 p-0 text-red-600 hover:text-red-800 ml-2"
                  @click="deleteNote(item.id)"
                >
                  <Icon name="lucide:x" class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Note Edit Form -->
          <div v-if="editingNoteId === item.id" class="mt-3 ml-7">
            <div class="space-y-2">
              <textarea
                v-model="tempNoteText"
                rows="3"
                placeholder="Add a note about why this item failed or needs attention..."
                class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <div class="flex space-x-2">
                <Button size="sm" @click="saveNote(item.id)">
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="cancelNote"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-200">
        <div class="text-sm text-muted-foreground">
          {{ completedCount === totalCount ? 'QA checklist completed!' : `${totalCount - completedCount} items remaining` }}
        </div>
        <div class="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            @click="resetChecklist"
          >
            Reset All
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="markAllComplete"
          >
            Mark All Complete
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
