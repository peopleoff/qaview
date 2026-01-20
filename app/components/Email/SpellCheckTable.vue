<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { SpellError } from '@@/lib/db/schema/spellErrors'

interface Props {
  spellErrors: SpellError[]
}

interface Emits {
  (e: 'deleted', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const db = useDatabase()
const toast = useToast()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const deletingErrors = ref<Set<number>>(new Set())

function getSuggestions(suggestionsStr: string | null): string[] {
  if (!suggestionsStr) return []
  // Suggestions are stored as comma-separated values
  return suggestionsStr.split(', ').filter(Boolean)
}

function getSpellingStats() {
  if (props.spellErrors.length === 0) {
    return { status: 'Perfect', color: 'success' as const }
  } else if (props.spellErrors.length <= 5) {
    return { status: 'Good', color: 'warning' as const }
  } else {
    return { status: 'Needs Review', color: 'error' as const }
  }
}

async function deleteError(errorId: number) {
  deletingErrors.value.add(errorId)

  try {
    const result = await db.deleteSpellError(errorId)

    if (result.success) {
      emit('deleted', errorId)
      toast.add({
        title: 'Success',
        description: 'Spelling error dismissed',
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to delete spelling error',
        color: 'error',
      })
    }
  } catch (error) {
    console.error('Failed to delete spell error:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete spelling error',
      color: 'error',
    })
  } finally {
    deletingErrors.value.delete(errorId)
  }
}

const columns: TableColumn<SpellError>[] = [
  {
    accessorKey: 'word',
    header: 'Misspelled Word',
    cell: ({ row }) => {
      const word = row.getValue('word') as string
      return h('code', { class: 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm' }, [word])
    }
  },
  {
    accessorKey: 'context',
    header: 'Context',
    cell: ({ row }) => {
      const context = row.getValue('context') as string | null
      return h('div', { class: 'text-sm text-gray-500 max-w-[300px] truncate' }, [context || '-'])
    }
  },
  {
    accessorKey: 'suggestions',
    header: 'Suggestions',
    cell: ({ row }) => {
      const suggestions = getSuggestions(row.getValue('suggestions') as string | null)
      if (suggestions.length === 0) {
        return h('span', { class: 'text-sm text-gray-400' }, ['No suggestions'])
      }
      return h('div', { class: 'flex flex-wrap gap-1' },
        suggestions.map(suggestion =>
          h('span', { class: 'inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs' }, [suggestion])
        )
      )
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const isDeleting = deletingErrors.value.has(row.original.id)
      return h(UButton, {
        icon: isDeleting ? 'i-lucide-loader-2' : 'i-lucide-x',
        variant: 'ghost',
        size: 'xs',
        color: 'error',
        disabled: isDeleting,
        class: isDeleting ? 'animate-spin' : '',
        title: 'Dismiss error',
        onClick: () => deleteError(row.original.id)
      })
    }
  }
]

const stats = computed(() => getSpellingStats())
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">Spelling Check</h2>
          <p class="text-sm text-gray-400 mt-1">Spelling and Grammar Analysis</p>
        </div>
        <div class="flex items-center gap-3">
          <UBadge :color="stats.color" variant="subtle">
            <UIcon name="i-lucide-spell-check" class="mr-1.5 h-3 w-3" />
            {{ stats.status }}
          </UBadge>
          <span class="text-sm text-gray-500">
            {{ spellErrors.length }} {{ spellErrors.length === 1 ? 'error' : 'errors' }} found
          </span>
        </div>
      </div>
    </template>

    <!-- Errors Table -->
    <div v-if="spellErrors.length > 0">
      <UTable :columns="columns" :data="spellErrors" />
    </div>

    <!-- No Errors State -->
    <div v-else class="text-center py-8">
      <UIcon name="i-lucide-check-circle" class="mx-auto h-12 w-12 text-green-500" />
      <h3 class="mt-4 text-lg font-medium text-gray-400">
        Perfect Spelling!
      </h3>
      <p class="mt-2 text-gray-500">
        No spelling or grammar errors were found in this email.
      </p>
    </div>
  </UCard>
</template>
