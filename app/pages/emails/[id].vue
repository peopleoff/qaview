<script lang="ts" setup>
import type { Email } from '@@/lib/db/schema/emails'
import type { Link } from '@@/lib/db/schema/links'
import type { Image } from '@@/lib/db/schema/images'
import type { QAChecklistItem } from '@@/lib/db/schema/qaChecklist'
import type { QANote } from '@@/lib/db/schema/qaNotes'
import type { SpellError } from '@@/lib/db/schema/spellErrors'

const route = useRoute()
const db = useDatabase()
const toast = useToast()

// Get email ID from route
const id = Number(route.params.id)

// State
const email = ref<Email | null>(null)
const links = ref<Link[]>([])
const images = ref<Image[]>([])
const qaChecklist = ref<QAChecklistItem[]>([])
const qaNotes = ref<QANote[]>([])
const spellErrors = ref<SpellError[]>([])
const loading = ref(true)
const analyzing = ref(false)
const selectedImage = ref<string | null>(null)
const exporting = ref(false)
const metadataEditorOpen = ref(false)

// Data URLs for screenshots
const screenshotDesktopDataUrl = ref<string | null>(null)
const screenshotMobileDataUrl = ref<string | null>(null)
const screenshotDataUrl = ref<string | null>(null)

// Fetch email data
async function fetchEmailData() {
  loading.value = true

  const result = await db.getEmail(id)

  if (result.success && result.data) {
    email.value = result.data
    links.value = result.data.links || []
    images.value = result.data.images || []
    qaChecklist.value = result.data.qaChecklist || []
    qaNotes.value = result.data.qaNotes || []
    spellErrors.value = result.data.spellErrors || []

    // Load screenshot images as data URLs
    if (result.data.screenshotDesktopUrl) {
      const desktopResult = await db.getImageData(result.data.screenshotDesktopUrl)
      if (desktopResult.success) {
        screenshotDesktopDataUrl.value = desktopResult.data
      }
    }

    if (result.data.screenshotMobileUrl) {
      const mobileResult = await db.getImageData(result.data.screenshotMobileUrl)
      if (mobileResult.success) {
        screenshotMobileDataUrl.value = mobileResult.data
      }
    }

    if (result.data.screenshotUrl) {
      const screenshotResult = await db.getImageData(result.data.screenshotUrl)
      if (screenshotResult.success) {
        screenshotDataUrl.value = screenshotResult.data
      }
    }
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'Failed to load email',
      color: 'error'
    })
  }

  loading.value = false
}

// Analyze email
async function analyzeEmail() {
  analyzing.value = true

  const result = await db.analyzeEmail(id)

  if (result.success) {
    toast.add({
      title: 'Success',
      description: 'Email analyzed successfully',
      color: 'success'
    })
    await fetchEmailData()
  } else {
    toast.add({
      title: 'Error',
      description: result.error || 'Failed to analyze email',
      color: 'error'
    })
  }

  analyzing.value = false
}

// Export email to PDF
async function exportPdf() {
  if (!email.value) return

  exporting.value = true

  try {
    const result = await db.exportPdf(String(id))

    if (result.success && result.data) {
      toast.add({
        title: 'Success',
        description: `PDF exported to ${result.data.filePath}`,
        color: 'success'
      })
    } else {
      // Don't show error toast if user cancelled
      if (result.error && result.error !== 'Export cancelled') {
        toast.add({
          title: 'Error',
          description: result.error || 'Failed to export PDF',
          color: 'error'
        })
      }
    }
  } finally {
    exporting.value = false
  }
}

// QA Checklist handlers
async function handleChecklistUpdate(id: number, completed: boolean) {
  const result = await db.updateQAChecklistItem(id, { completed })

  if (result.success) {
    // Update local state
    const item = qaChecklist.value.find(i => i.id === id)
    if (item) {
      item.completed = completed
    }
  }
}

async function handleChecklistNoteUpdate(id: number, note: string | null) {
  const result = await db.updateQAChecklistItem(id, { note })

  if (result.success) {
    // Update local state
    const item = qaChecklist.value.find(i => i.id === id)
    if (item) {
      item.note = note
    }
  }
}

async function handleResetAll() {
  // Update all items to uncompleted
  for (const item of qaChecklist.value) {
    await db.updateQAChecklistItem(item.id, { completed: false })
    item.completed = false
  }
}

async function handleMarkAllComplete() {
  // Update all items to completed
  for (const item of qaChecklist.value) {
    await db.updateQAChecklistItem(item.id, { completed: true })
    item.completed = true
  }
}

// Image modal handlers
function openImageModal(imageSrc: string) {
  selectedImage.value = imageSrc
}

function closeImageModal() {
  selectedImage.value = null
}

// Link/Image update handlers
function handleLinkUpdated(updatedLink: Link) {
  const index = links.value.findIndex(l => l.id === updatedLink.id)
  if (index !== -1) {
    links.value[index] = updatedLink
  }
}

function handleImageUpdated(updatedImage: Image) {
  const index = images.value.findIndex(i => i.id === updatedImage.id)
  if (index !== -1) {
    images.value[index] = updatedImage
  }
}

function handleSpellErrorDeleted(deletedId: number) {
  spellErrors.value = spellErrors.value.filter(e => e.id !== deletedId)
}

function handleEmailIdUpdated(newEmailId: string) {
  if (email.value) {
    email.value.emailId = newEmailId
  }
}

function handleMetadataUpdated(updatedEmail: Email) {
  if (email.value) {
    email.value.emailId = updatedEmail.emailId
    email.value.subject = updatedEmail.subject
  }
}

// Tabs for preview
const previewTabs = [
  { key: 'desktop', label: 'Desktop (800px)', icon: 'i-lucide-monitor' },
  { key: 'mobile', label: 'Mobile (375px)', icon: 'i-lucide-smartphone' }
]

// Load data on mount
onMounted(() => {
  fetchEmailData()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto py-8 px-4 space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>

      <!-- Email Details -->
      <template v-else-if="email">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-bold">Email Analysis</h1>
              <p class="text-muted mt-1">Last updated: {{ email.updatedAt ? new Date(email.updatedAt).toLocaleString() : 'N/A' }}</p>
            </div>
            <UButton
              icon="i-lucide-arrow-left"
              label="Back to List"
              variant="ghost"
              @click="navigateTo('/')"
            />
          </div>
        </div>

        <!-- UTM Campaign Conflict Resolution -->
        <EmailEmailIdSelector
          v-if="email.analyzed"
          :email-db-id="id"
          :current-email-id="email.emailId"
          @updated="handleEmailIdUpdated"
        />

        <!-- Summary Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold">Summary</h2>
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  size="xs"
                  title="Edit metadata"
                  @click="metadataEditorOpen = true"
                />
              </div>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="email.analyzed ? 'success' : 'warning'"
                  variant="subtle"
                >
                  {{ email.analyzed ? 'Analyzed' : 'Pending Analysis' }}
                </UBadge>
                <UButton
                  v-if="!email.analyzed"
                  icon="i-lucide-sparkles"
                  label="Analyze Email"
                  :loading="analyzing"
                  @click="analyzeEmail"
                />
                <UButton
                  v-if="email.analyzed"
                  icon="i-lucide-eye"
                  label="Preview"
                  variant="ghost"
                  @click="navigateTo(`/emails/${id}/preview`)"
                />
                <UButton
                  v-if="email.analyzed"
                  icon="i-lucide-download"
                  label="Export PDF"
                  :loading="exporting"
                  variant="outline"
                  @click="exportPdf"
                />
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Email Metadata -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Email ID</h3>
                <p class="text-lg font-medium font-mono">{{ email.emailId || 'Not set' }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
                <p class="text-lg font-medium">{{ email.subject || 'No subject' }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Filename</h3>
                <p class="text-lg font-medium">{{ email.filename }}</p>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Links</h3>
                <p class="text-2xl font-bold">{{ links.length }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Images</h3>
                <p class="text-2xl font-bold">{{ images.length }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">QA Items</h3>
                <p class="text-2xl font-bold">{{ qaChecklist.length }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Spelling Errors</h3>
                <p class="text-2xl font-bold">{{ spellErrors.length }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Preview Card -->
        <UCard v-if="email.analyzed && (screenshotDesktopDataUrl || screenshotMobileDataUrl || screenshotDataUrl)">
          <template #header>
            <h2 class="text-xl font-semibold">Preview</h2>
          </template>

          <UTabs v-if="screenshotDesktopDataUrl || screenshotMobileDataUrl" :items="previewTabs" :default-index="0">
            <template #default="{ item }">
              <div class="flex items-center gap-2 relative">
                <span class="truncate">{{ item.label }}</span>
              </div>
            </template>

            <template #content="{ item }">
              <!-- Desktop Preview -->
              <div v-if="item.key === 'desktop' && screenshotDesktopDataUrl" class="text-center py-4">
                <img
                  :src="screenshotDesktopDataUrl"
                  alt="Desktop Email Preview"
                  class="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                  @click="openImageModal(screenshotDesktopDataUrl)"
                />
              </div>
              <div v-else-if="item.key === 'desktop'" class="text-center py-8">
                <UIcon name="i-lucide-image-off" class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-2 text-gray-500">No desktop screenshot available</p>
              </div>

              <!-- Mobile Preview -->
              <div v-if="item.key === 'mobile' && screenshotMobileDataUrl" class="text-center py-4">
                <img
                  :src="screenshotMobileDataUrl"
                  alt="Mobile Email Preview"
                  class="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                  style="max-width: 375px;"
                  @click="openImageModal(screenshotMobileDataUrl)"
                />
              </div>
              <div v-else-if="item.key === 'mobile'" class="text-center py-8">
                <UIcon name="i-lucide-image-off" class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-2 text-gray-500">No mobile screenshot available</p>
              </div>
            </template>
          </UTabs>

          <!-- Fallback Screenshot (if no desktop/mobile specific) -->
          <div v-else-if="screenshotDataUrl" class="text-center py-4">
            <img
              :src="screenshotDataUrl"
              alt="Email Preview"
              class="max-w-full h-auto border border-gray-300 rounded-lg shadow-sm mx-auto cursor-pointer hover:opacity-90 transition-opacity"
              @click="openImageModal(screenshotDataUrl)"
            />
          </div>
        </UCard>


        <!-- Links Table -->
        <EmailLinksTable :links="links" @open-image="openImageModal" @updated="handleLinkUpdated" />

        <!-- Images Table -->
        <EmailImagesTable :images="images" @open-image="openImageModal" @updated="handleImageUpdated" />

        <!-- Spell Check Table -->
        <EmailSpellCheckTable
          v-if="email.analyzed"
          :spell-errors="spellErrors"
          @deleted="handleSpellErrorDeleted"
        />

      <!-- Attachments -->
        <EmailAttachments :email-id="id" />

        <!-- QA Notes -->
        <QANotes :email-id="id" />

        <!-- QA Checklist -->
        <QAChecklist
          :items="qaChecklist"
          @update="handleChecklistUpdate"
          @update-note="handleChecklistNoteUpdate"
          @reset-all="handleResetAll"
          @mark-all-complete="handleMarkAllComplete"
        />
      </template>

      <!-- Not Found -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-semibold mb-2">Email not found</h3>
        <UButton
          icon="i-lucide-arrow-left"
          label="Back to List"
          @click="navigateTo('/')"
        />
      </div>
    </div>

    <!-- Image Modal -->
    <ImageModal :image-url="selectedImage" @close="closeImageModal" />

    <!-- Metadata Editor Modal -->
    <EmailMetadataEditor
      :open="metadataEditorOpen"
      :email="email"
      @update:open="metadataEditorOpen = $event"
      @updated="handleMetadataUpdated"
    />
  </div>
</template>
