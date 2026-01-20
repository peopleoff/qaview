<script lang="ts" setup>
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Link } from '@@/lib/db/schema/links'

interface Props {
  links: Link[]
}

interface Emits {
  (e: 'openImage', url: string): void
  (e: 'updated', link: Link): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// Edit dialog state
const editDialogOpen = ref(false)
const selectedLink = ref<Link | null>(null)

function openEditDialog(link: Link) {
  selectedLink.value = link
  editDialogOpen.value = true
}

function handleLinkUpdated(link: Link) {
  emit('updated', link)
}

const columns: TableColumn<Link>[] = [
  {
    accessorKey: 'text',
    header: 'Text',
    cell: ({ row }) => {
      const text = (row.getValue('text') as string | null) || 'No text'
      const isEdited = row.original.isEdited === 1
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'text-sm' }, [text]),
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
        variant: 'solid',
      }, () => String(status))
    }
  },
  {
    id: 'utm_medium',
    header: 'utm_medium',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams
      return h('span', { class: 'text-sm' }, [utmParams?.utm_medium || '-'])
    }
  },
  {
    id: 'utm_campaign',
    header: 'utm_campaign',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams
      return h('span', { class: 'text-sm' }, [utmParams?.utm_campaign || '-'])
    }
  },
  {
    id: 'utm_source',
    header: 'utm_source',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams
      return h('span', { class: 'text-sm' }, [utmParams?.utm_source || '-'])
    }
  },
  {
    id: 'utm_content',
    header: 'utm_content',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams
      return h('span', { class: 'text-sm' }, [utmParams?.utm_content || '-'])
    }
  },
  {
    accessorKey: 'screenshotUrl',
    header: 'Screenshot',
    cell: ({ row }) => {
      const screenshotUrl = row.getValue('screenshotUrl') as string | null
      if (!screenshotUrl) return h('span', { class: 'text-sm text-gray-400' }, ['-'])

      return h('img', {
        src: screenshotUrl,
        alt: 'Link Screenshot',
        class: 'w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity',
        onClick: () => emit('openImage', screenshotUrl)
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
  <UCard>
    <template #header>
      <div>
        <h2 class="text-xl font-semibold">Links</h2>
        <p class="text-sm text-gray-400 mt-1">Links Analysis</p>
      </div>
    </template>

    <!-- Links Table -->
    <div v-if="links.length > 0">
      <UTable :columns="columns" :data="links" />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <UIcon name="i-lucide-link" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-400">No Links Found</h3>
      <p class="mt-2 text-gray-500">
        This email contains no links, or hasn't been analyzed yet.
      </p>
    </div>
  </UCard>

  <!-- Edit Link Dialog -->
  <EmailEditLinkDialog
    :open="editDialogOpen"
    :link="selectedLink"
    @update:open="editDialogOpen = $event"
    @updated="handleLinkUpdated"
  />
</template>
