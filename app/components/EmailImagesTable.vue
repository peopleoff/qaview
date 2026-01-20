<script lang="ts" setup>
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Image } from '@@/lib/db/schema/images'

interface Props {
  images: Image[]
}

interface Emits {
  (e: 'openImage', url: string): void
  (e: 'updated', image: Image): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// Edit dialog state
const editDialogOpen = ref(false)
const selectedImage = ref<Image | null>(null)

function openEditDialog(image: Image) {
  selectedImage.value = image
  editDialogOpen.value = true
}

function handleImageUpdated(image: Image) {
  emit('updated', image)
}

const columns: TableColumn<Image>[] = [
  {
    accessorKey: 'alt',
    header: 'Alt Text',
    cell: ({ row }) => {
      const alt = (row.getValue('alt') as string | null) || 'No alt text'
      const isEdited = row.original.isEdited === 1
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'text-sm' }, [alt]),
        isEdited ? h(UBadge, { color: 'info', variant: 'subtle', size: 'xs' }, () => 'Edited') : null
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as number | null
      if (!status) return h('span', { class: 'text-sm text-gray-400' }, ['N/A'])

      return h(UBadge, {
        color: status >= 200 && status < 300 ? 'success' : 'error',
        variant: 'subtle'
      }, () => String(status))
    }
  },
  {
    id: 'dimensions',
    header: 'Dimensions',
    cell: ({ row }) => {
      const width = row.original.width
      const height = row.original.height
      return h('span', { class: 'text-sm' }, [`${width || '?'} × ${height || '?'}`])
    }
  },
  {
    accessorKey: 'src',
    header: 'Preview',
    cell: ({ row }) => {
      const src = row.getValue('src') as string | null
      if (!src) return h('span', { class: 'text-sm text-gray-400' }, ['-'])

      return h('img', {
        src,
        alt: 'Image preview',
        class: 'w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity',
        onClick: () => emit('openImage', src)
      })
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(UButton, {
        icon: 'i-lucide-pencil',
        variant: 'ghost',
        size: 'xs',
        onClick: () => openEditDialog(row.original)
      })
    }
  }
]
</script>

<template>
  <UCard v-if="images.length > 0">
    <template #header>
      <div>
        <h2 class="text-xl font-semibold">Images</h2>
        <p class="text-sm text-gray-400 mt-1">Images Analysis</p>
      </div>
    </template>

    <UTable :columns="columns" :data="images" />
  </UCard>

  <!-- Edit Image Dialog -->
  <EmailEditImageDialog
    :open="editDialogOpen"
    :image="selectedImage"
    @update:open="editDialogOpen = $event"
    @updated="handleImageUpdated"
  />
</template>
