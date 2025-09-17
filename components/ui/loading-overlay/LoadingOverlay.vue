<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  show?: boolean;
  title?: string;
  description?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: "Loading...",
  description: "",
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.show"
      :class="cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center', props.class)"
    >
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-sm mx-4 text-center">
        <!-- Loading spinner -->
        <div class="flex justify-center mb-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>

        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {{ props.title }}
        </h3>

        <!-- Description -->
        <p v-if="props.description" class="text-sm text-gray-600">
          {{ props.description }}
        </p>
      </div>
    </div>
  </Teleport>
</template>