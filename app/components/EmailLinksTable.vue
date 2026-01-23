<script lang="ts" setup>
import { h, resolveComponent, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Link, UtmParams } from '@@/lib/db/schema/links'

interface Props {
  links: Link[]
  emailId: number
}

interface Emits {
  (e: 'openImage', url: string): void
  (e: 'updated', link: Link): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const db = useDatabase()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// Screenshot state - maps link.id to base64 data URL
const linkScreenshots = ref<Map<number, string>>(new Map())

// Load screenshots for all links with screenshotPath
async function loadLinkScreenshots() {
  const newScreenshots = new Map<number, string>()
  for (const link of props.links) {
    if (link.screenshotPath) {
      const result = await db.getImageData(link.screenshotPath)
      if (result.success && result.data) {
        newScreenshots.set(link.id, result.data)
      }
    }
  }
  linkScreenshots.value = newScreenshots
}

// Load screenshots when links change
watch(() => props.links, loadLinkScreenshots, { immediate: true })

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

// Re-analyze dialog state
const reanalyzeDialogOpen = ref(false)
const linkToReanalyze = ref<Link | null>(null)
const isReanalyzing = ref(false)

function openReanalyzeDialog(link: Link) {
  linkToReanalyze.value = link
  reanalyzeDialogOpen.value = true
}

async function confirmReanalyze() {
  if (!linkToReanalyze.value) return
  isReanalyzing.value = true
  try {
    const result = await db.reanalyzeLink(linkToReanalyze.value.id, props.emailId)
    if (result.success && result.data) {
      // Reload the screenshot for the updated link
      if (result.data.screenshotPath) {
        const imgResult = await db.getImageData(result.data.screenshotPath)
        if (imgResult.success && imgResult.data) {
          linkScreenshots.value.set(result.data.id, imgResult.data)
        }
      }
      emit('updated', result.data)
      reanalyzeDialogOpen.value = false
    }
  } finally {
    isReanalyzing.value = false
  }
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
      const utmParams = row.original.utmParams as UtmParams | null
      return h('span', { class: 'text-sm' }, [utmParams?.utm_medium || '-'])
    }
  },
  {
    id: 'utm_campaign',
    header: 'utm_campaign',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams as UtmParams | null
      return h('span', { class: 'text-sm' }, [utmParams?.utm_campaign || '-'])
    }
  },
  {
    id: 'utm_source',
    header: 'utm_source',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams as UtmParams | null
      return h('span', { class: 'text-sm' }, [utmParams?.utm_source || '-'])
    }
  },
  {
    id: 'utm_content',
    header: 'utm_content',
    cell: ({ row }) => {
      const utmParams = row.original.utmParams as UtmParams | null
      return h('span', { class: 'text-sm' }, [utmParams?.utm_content || '-'])
    }
  },
  {
    accessorKey: 'screenshotPath',
    header: 'Screenshot',
    cell: ({ row }) => {
      const dataUrl = linkScreenshots.value.get(row.original.id)
      if (!dataUrl) return h('span', { class: 'text-sm text-gray-400' }, ['-'])

      return h('img', {
        src: dataUrl,
        alt: 'Link Screenshot',
        class: 'w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity',
        onClick: () => emit('openImage', dataUrl)
      })
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-1' }, [
        h(UButton, {
          icon: 'i-lucide-refresh-cw',
          variant: 'ghost',
          size: 'xs',
          title: 'Re-analyze link',
          onClick: () => openReanalyzeDialog(row.original)
        }),
        h(UButton, {
          icon: 'i-lucide-pencil',
          variant: 'ghost',
          size: 'xs',
          title: 'Edit link',
          onClick: () => openEditDialog(row.original)
        })
      ])
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

  <!-- Re-analyze Confirmation Dialog -->
  <UModal v-model:open="reanalyzeDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-refresh-cw" class="h-5 w-5" />
            <span class="font-semibold">Re-analyze Link?</span>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-sm">This will re-fetch the link destination, update redirect chain, UTM parameters, and take a new screenshot.</p>
          <p class="text-sm text-gray-500 truncate">{{ linkToReanalyze?.url }}</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="reanalyzeDialogOpen = false">Cancel</UButton>
            <UButton color="primary" :loading="isReanalyzing" @click="confirmReanalyze">
              Re-analyze
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
