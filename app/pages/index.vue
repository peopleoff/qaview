<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Email } from '@@/lib/db/schema/emails'

const db = useDatabase();
const toast = useToast();
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// State
const emails = ref<Email[]>([]);
const loading = ref(true);
const deleteDialogOpen = ref(false);
const emailToDelete = ref<number | null>(null);
const exportingEmails = ref<Set<string>>(new Set());

interface SortingState {
  id: string
  desc: boolean
}
const sorting = ref<SortingState[]>([]);

// Fetch emails on mount
onMounted(async () => {
  await fetchEmails();
});

async function fetchEmails() {
  loading.value = true;
  const result = await db.getEmails();
  console.log(result);
  if (result.success && result.data) {
    emails.value = result.data;
  } else {
    toast.add({
      title: "Error",
      description: result.error || "Failed to load emails",
      color: "error",
    });
  }
  loading.value = false;
}

async function handleDelete(id: number) {
  emailToDelete.value = id;
  deleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!emailToDelete.value) return;

  const result = await db.deleteEmail(emailToDelete.value);
  if (result.success) {
    toast.add({
      title: "Success",
      description: "Email deleted successfully",
      color: "success",
    });
    await fetchEmails();
  } else {
    toast.add({
      title: "Error",
      description: result.error || "Failed to delete email",
      color: "error",
    });
  }

  deleteDialogOpen.value = false;
  emailToDelete.value = null;
}

async function handleExportPdf(emailId: string) {
  if (exportingEmails.value.has(emailId)) return;

  exportingEmails.value.add(emailId);

  try {
    const result = await db.exportPdf(emailId);

    if (result.success && result.data) {
      toast.add({
        title: "Success",
        description: `PDF exported to ${result.data.filePath}`,
        color: "success",
      });
    } else {
      // Don't show error toast if user cancelled
      if (result.error && result.error !== "Export cancelled") {
        toast.add({
          title: "Error",
          description: result.error || "Failed to export PDF",
          color: "error",
        });
      }
    }
  } finally {
    exportingEmails.value.delete(emailId);
  }
}

async function handleUpload() {
  const selectResult = await db.selectFile();
  if (selectResult.success && selectResult.data) {
    // Upload the file
    const uploadResult = await db.uploadEmail(selectResult.data);
    if (uploadResult.success) {
      toast.add({
        title: "Success",
        description: uploadResult.message,
        color: "success",
      });
      // Refresh email list
      await fetchEmails();
    } else {
      toast.add({
        title: "Error",
        description: uploadResult.error || "Failed to upload email",
        color: "error",
      });
    }
  }
}

// Table columns
const columns: TableColumn<Email>[] = [
  {
    accessorKey: 'subject',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Subject',
        icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    enableSorting: true,
    cell: ({ row }) => {
      const id = row.original.id
      const subject = row.getValue('subject') || 'No subject'
      return h('a', {
        href: `/emails/${id}`,
        class: 'text-primary hover:underline cursor-pointer',
        onClick: (e: Event) => {
          e.preventDefault()
          navigateTo(`/emails/${id}`)
        }
      }, subject as string)
    }
  },
  {
    accessorKey: 'filename',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Filename',
        icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    enableSorting: true
  },
  {
    accessorKey: 'analyzed',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Status',
        icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    enableSorting: true,
    cell: ({ row }) => {
      const analyzed = row.getValue('analyzed')
      return h(UBadge, {
        color: analyzed ? 'success' : 'warning',
        variant: 'subtle'
      }, () => analyzed ? 'Analyzed' : 'Pending')
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Created',
        icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    enableSorting: true,
    cell: ({ row }) => {
      const date: Date = row.getValue('createdAt')
      return date ? new Date(date).toLocaleDateString() : 'N/A'
    }
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => {
      const analyzed = row.original.analyzed
      const id = row.original.id
      const isExporting = exportingEmails.value.has(String(row.original.id))
      return h('div', { class: 'flex items-center gap-2' }, [
        analyzed && h('button', {
          class: `text-gray-500 hover:text-gray-700 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`,
          'aria-label': 'Download report',
          disabled: isExporting,
          onClick: () => handleExportPdf(String(row.original.id)),
          innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>'
        }),
        h('button', {
          class: 'text-red-500 hover:text-red-700',
          'aria-label': 'Delete email',
          onClick: () => handleDelete(id),
          innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
        })
      ])
    }
  }
];
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto py-8 px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">QAView</h1>
        <p class="text-muted text-lg">Email quality assurance analysis tool</p>
      </div>

      <!-- Main Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Email History</h2>
            <UButton
              icon="i-lucide-upload"
              label="Upload Email"
              @click="handleUpload"
            />
          </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
        </div>

        <!-- Empty State -->
        <div v-else-if="emails.length === 0" class="text-center py-12">
          <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 class="text-lg font-semibold mb-2">No emails yet</h3>
          <p class="text-muted mb-4">Upload an .eml file to get started with QA analysis</p>
          <UButton
            icon="i-lucide-upload"
            label="Upload Your First Email"
            @click="handleUpload"
          />
        </div>

        <!-- Table -->
        <UTable
          v-else
          v-model:sorting="sorting"
          :data="emails"
          :columns="columns"
        />
      </UCard>

      <!-- Delete Confirmation Modal -->
      <UModal v-model:open="deleteDialogOpen" title="Confirm Deletion" description="Are you sure you want to delete this email? This action cannot be undone.">
        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="close"
            />
            <UButton
              label="Delete"
              color="error"
              @click="confirmDelete"
            />
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>
