<script lang="ts" setup>
interface Props {
  imageUrl: string | null
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div
    v-if="imageUrl"
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    @click="emit('close')"
  >
    <div class="relative max-w-[90vw] max-h-[90vh] p-4">
      <button
        class="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-black hover:bg-gray-200 z-10"
        @click="emit('close')"
      >
        ×
      </button>
      <img
        :src="imageUrl"
        alt="Full size image"
        class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        @click.stop
      />
    </div>
  </div>
</template>
