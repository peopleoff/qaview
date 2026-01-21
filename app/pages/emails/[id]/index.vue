<script lang="ts" setup>
import type { Email } from '@@/lib/db/schema/emails'
import type { Link } from '@@/lib/db/schema/links'
import type { Image } from '@@/lib/db/schema/images'
import type { QAChecklistItem } from '@@/lib/db/schema/qaChecklist'
import type { QANote } from '@@/lib/db/schema/qaNotes'
import type { SpellError } from '@@/lib/db/schema/spellErrors'
import type { Attachment } from '@@/lib/db/schema/attachments'

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
const attachments = ref<Attachment[]>([])
const loading = ref(true)
const analyzing = ref(false)
const selectedImage = ref<string | null>(null)
const exporting = ref(false)
const metadataEditorOpen = ref(false)
const exportConfirmOpen = ref(false)

// Analysis progress tracking
const analysisProgress = ref<{
  stage: 'parsing' | 'screenshots' | 'links' | 'images' | 'complete';
  message: string;
  current?: number;
  total?: number;
} | null>(null)

// Data URLs for screenshots
const screenshotDesktopDataUrl = ref<string | null>(null)
const screenshotMobileDataUrl = ref<string | null>(null)

// Export validation computed properties
const incompleteChecklistItems = computed(() =>
  qaChecklist.value.filter(item => !item.completed)
)
const hasSendLogs = computed(() => attachments.value.length > 0)
const isExportReady = computed(() =>
  incompleteChecklistItems.value.length === 0 && hasSendLogs.value
)

// Fetch email data
async function fetchEmailData() {
  loading.value = true

  const result = await db.getEmail(id)

  if (!result.success) {
    toast.add({
      title: 'Error',
      description: result.error,
      color: 'error'
    })
    loading.value = false
    return
  }

  if (result.data) {
    email.value = result.data
    links.value = result.data.links || []
    images.value = result.data.images || []
    qaChecklist.value = result.data.qaChecklist || []
    qaNotes.value = result.data.qaNotes || []
    spellErrors.value = result.data.spellErrors || []

    // Load attachments
    const attachmentsResult = await db.getAttachments(id)
    if (attachmentsResult.success) {
      attachments.value = attachmentsResult.data || []
    }

    // Load screenshot images as data URLs
    if (result.data.screenshotDesktopUrl) {
      const desktopResult = await db.getImageData(result.data.screenshotDesktopUrl)
      if (desktopResult.success) {
        screenshotDesktopDataUrl.value = desktopResult.data ?? null
      }
    }

    if (result.data.screenshotMobileUrl) {
      const mobileResult = await db.getImageData(result.data.screenshotMobileUrl)
      if (mobileResult.success) {
        screenshotMobileDataUrl.value = mobileResult.data ?? null
      }
    }
  }

  loading.value = false
}

// Analyze email
async function analyzeEmail() {
  analyzing.value = true
  analysisProgress.value = { stage: 'parsing', message: 'Starting analysis...' }

  // Set up progress listener
  if (import.meta.client && window.electronAPI) {
    window.electronAPI.onAnalysisProgress((progress) => {
      analysisProgress.value = progress
    })
  }

  try {
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
  } finally {
    // Clean up progress listener
    if (import.meta.client && window.electronAPI?.removeAnalysisProgressListener) {
      window.electronAPI.removeAnalysisProgressListener()
    }
    analyzing.value = false
    analysisProgress.value = null
  }
}

// Export email to PDF
async function exportPdf() {
  if (!email.value) return

  // Check if confirmation needed
  if (!isExportReady.value) {
    exportConfirmOpen.value = true
    return
  }

  // Proceed with export directly
  await doExport()
}

// Actual export logic
async function doExport() {
  exporting.value = true

  try {
    const result = await db.exportPdf(String(id))

    if (!result.success) {
      // Don't show error toast if user cancelled
      if (result.error !== 'Export cancelled') {
        toast.add({
          title: 'Error',
          description: result.error,
          color: 'error'
        })
      }
      return
    }

    if (result.data) {
      toast.add({
        title: 'Success',
        description: `PDF exported to ${result.data.filePath}`,
        color: 'success'
      })
    }
  } finally {
    exporting.value = false
  }
}

// Handle export confirmation
function handleExportConfirm() {
  exportConfirmOpen.value = false
  doExport()
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

// Navigation
function goToPreview() {
  navigateTo(`/emails/${id}/preview`)
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
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
    </div>

    <!-- Email Details -->
    <template v-else-if="email">
      <!-- UTM Campaign Conflict Resolution -->
        <EmailIdSelector
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
                  @click="goToPreview"
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
              <div class="break-all">
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Email ID</h3>
                <p class="text-lg font-medium font-mono">{{ email.emailId || 'Not set' }}</p>
              </div>
              <div class="break-all">
                <h3 class="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
                <p class="text-lg font-medium">{{ email.subject || 'No subject' }}</p>
              </div>
              <div class="break-all">
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
        <UCard v-if="email.analyzed && (screenshotDesktopDataUrl || screenshotMobileDataUrl)">
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

    <!-- Image Modal -->
    <ImageModal :image-url="selectedImage" @close="closeImageModal" />

    <!-- Metadata Editor Modal -->
    <EmailMetadataEditor
      :open="metadataEditorOpen"
      :email="email"
      @update:open="metadataEditorOpen = $event"
      @updated="handleMetadataUpdated"
    />

    <!-- Export Confirmation Dialog -->
    <ExportConfirmDialog
      :open="exportConfirmOpen"
      :incomplete-items="incompleteChecklistItems"
      :has-send-logs="hasSendLogs"
      @update:open="exportConfirmOpen = $event"
      @confirm="handleExportConfirm"
    />

    <!-- Analysis Progress Modal -->
    <Teleport to="body">
      <div
        v-if="analyzing && analysisProgress"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <!-- Animated Icon based on stage -->
            <div class="mb-6">
              <div v-if="analysisProgress.stage === 'parsing'" class="flex justify-center">
                <UIcon name="i-lucide-file-text" class="w-16 h-16 text-blue-500 animate-pulse" />
              </div>
              <div v-else-if="analysisProgress.stage === 'screenshots'" class="flex justify-center">
                <UIcon name="i-lucide-camera" class="w-16 h-16 text-purple-500 animate-pulse" />
              </div>
              <div v-else-if="analysisProgress.stage === 'links'" class="flex justify-center">
                <UIcon name="i-lucide-link" class="w-16 h-16 text-green-500 animate-bounce" />
              </div>
              <div v-else-if="analysisProgress.stage === 'images'" class="flex justify-center">
                <UIcon name="i-lucide-image" class="w-16 h-16 text-orange-500 animate-pulse" />
              </div>
              <div v-else-if="analysisProgress.stage === 'complete'" class="flex justify-center">
                <UIcon name="i-lucide-check-circle" class="w-16 h-16 text-green-500" />
              </div>
            </div>

            <!-- Stage Title -->
            <h3 class="text-xl font-semibold mb-2">
              <span v-if="analysisProgress.stage === 'parsing'">Parsing Email</span>
              <span v-else-if="analysisProgress.stage === 'screenshots'">Taking Screenshots</span>
              <span v-else-if="analysisProgress.stage === 'links'">Validating Links</span>
              <span v-else-if="analysisProgress.stage === 'images'">Checking Images</span>
              <span v-else-if="analysisProgress.stage === 'complete'">Complete!</span>
            </h3>

            <!-- Progress Message -->
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              {{ analysisProgress.message }}
            </p>

            <!-- Progress Bar (for links/images with counts) -->
            <div
              v-if="analysisProgress.current !== undefined && analysisProgress.total !== undefined && analysisProgress.total > 0"
              class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2"
            >
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="{
                  'bg-green-500': analysisProgress.stage === 'links',
                  'bg-orange-500': analysisProgress.stage === 'images',
                  'bg-blue-500': analysisProgress.stage === 'parsing',
                }"
                :style="{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }"
              />
            </div>

            <!-- Stage Progress Indicator -->
            <div class="flex justify-center gap-2 mt-6">
              <div
                class="w-3 h-3 rounded-full"
                :class="analysisProgress.stage === 'parsing' || ['screenshots', 'links', 'images', 'complete'].includes(analysisProgress.stage) ? 'bg-blue-500' : 'bg-gray-300'"
              />
              <div
                class="w-3 h-3 rounded-full"
                :class="['screenshots', 'links', 'images', 'complete'].includes(analysisProgress.stage) ? 'bg-purple-500' : 'bg-gray-300'"
              />
              <div
                class="w-3 h-3 rounded-full"
                :class="['links', 'images', 'complete'].includes(analysisProgress.stage) ? 'bg-green-500' : 'bg-gray-300'"
              />
              <div
                class="w-3 h-3 rounded-full"
                :class="['images', 'complete'].includes(analysisProgress.stage) ? 'bg-orange-500' : 'bg-gray-300'"
              />
              <div
                class="w-3 h-3 rounded-full"
                :class="analysisProgress.stage === 'complete' ? 'bg-green-500' : 'bg-gray-300'"
              />
            </div>

            <!-- Hint about visible browser -->
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-4">
              A browser window will open so you can see links being validated
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
