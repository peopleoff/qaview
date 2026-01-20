<script setup lang="ts">
interface Props {
  emailDbId: number
  currentEmailId?: string | null
}

interface Emits {
  (e: 'updated', emailId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const db = useDatabase()
const toast = useToast()

const campaignData = ref<{
  availableCampaigns: string[]
  hasMultipleCampaigns: boolean
  hasNoCampaigns: boolean
} | null>(null)

const isLoading = ref(true)
const isSettingId = ref(false)
const showDialog = ref(false)
const selectedCampaign = ref('')

// Fetch UTM campaigns on mount
onMounted(async () => {
  await fetchCampaigns()
})

async function fetchCampaigns() {
  isLoading.value = true
  try {
    const result = await db.getUtmCampaigns(props.emailDbId)
    if (result.success && result.data) {
      campaignData.value = result.data
    }
  } catch (error) {
    console.error('Failed to fetch UTM campaigns:', error)
  } finally {
    isLoading.value = false
  }
}

async function setEmailId(campaign: string) {
  if (!campaign.trim()) return

  isSettingId.value = true
  try {
    const result = await db.setEmailId(props.emailDbId, campaign.trim())

    if (result.success) {
      toast.add({
        title: 'Success',
        description: `Email ID has been set to "${campaign}"`,
        color: 'success',
      })

      emit('updated', campaign)
      showDialog.value = false
      selectedCampaign.value = ''
      await fetchCampaigns()
    } else {
      toast.add({
        title: 'Error',
        description: result.error || 'Failed to update Email ID',
        color: 'error',
      })
    }
  } catch (error) {
    console.error('Failed to set email ID:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update Email ID',
      color: 'error',
    })
  } finally {
    isSettingId.value = false
  }
}
</script>

<template>
  <div v-if="!isLoading && campaignData">
    <!-- Show warning when multiple campaigns are found -->
    <UCard v-if="campaignData.hasMultipleCampaigns && !currentEmailId" class="border-yellow-300 bg-yellow-50">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-yellow-600" />
          <h3 class="text-lg font-semibold text-yellow-800">Multiple UTM Campaigns Found</h3>
        </div>
        <p class="text-sm text-yellow-700 mt-1">
          This email contains multiple utm_campaign values, which may indicate an issue that needs to be fixed.
        </p>
      </template>

      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium text-yellow-800">Available Campaigns:</label>
          <ul class="mt-1 space-y-1">
            <li v-for="campaign in campaignData.availableCampaigns" :key="campaign" class="text-sm text-yellow-700">
              • {{ campaign }}
            </li>
          </ul>
        </div>

        <UButton
          variant="outline"
          class="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
          @click="showDialog = true"
        >
          <UIcon name="i-lucide-settings" class="mr-2 h-4 w-4" />
          Select Email ID
        </UButton>
      </div>
    </UCard>

    <!-- Show info when no campaigns are found -->
    <UCard v-else-if="campaignData.hasNoCampaigns && !currentEmailId" class="border-blue-300 bg-blue-50">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-info" class="h-5 w-5 text-blue-600" />
          <h3 class="text-lg font-semibold text-blue-800">No UTM Campaign Found</h3>
        </div>
        <p class="text-sm text-blue-700 mt-1">
          This email doesn't contain any utm_campaign parameters in its links.
        </p>
      </template>
    </UCard>

    <!-- Select Email ID Dialog -->
    <UModal v-model:open="showDialog">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold">Select Email ID</h3>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            size="sm"
            @click="showDialog = false"
          />
        </div>
      </template>

      <div class="space-y-4 p-4">
        <p class="text-sm text-gray-500">
          Choose which utm_campaign value should be used as the Email ID for tracking.
        </p>

        <div class="space-y-2">
          <label class="text-sm font-medium">Available Campaigns:</label>
          <div class="space-y-2">
            <div
              v-for="campaign in campaignData.availableCampaigns"
              :key="campaign"
              class="flex items-center gap-2"
            >
              <input
                :id="`campaign-${campaign}`"
                v-model="selectedCampaign"
                type="radio"
                :value="campaign"
                class="h-4 w-4"
              />
              <label :for="`campaign-${campaign}`" class="text-sm font-mono">
                {{ campaign }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="showDialog = false">
            Cancel
          </UButton>
          <UButton
            :disabled="!selectedCampaign"
            :loading="isSettingId"
            @click="setEmailId(selectedCampaign)"
          >
            Set Email ID
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
