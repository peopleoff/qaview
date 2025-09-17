<script setup lang="ts">
import { toast } from "vue-sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const props = defineProps<{
  emailId: number;
  currentEmailId?: string | null;
}>();

const emit = defineEmits<{
  updated: [emailId: string];
}>();

const { data: campaignData, refresh: refreshCampaigns } = await useFetch(`/api/email/${props.emailId}/utm-campaigns`);
const isSettingId = ref(false);
const showDialog = ref(false);
const selectedCampaign = ref("");

async function setEmailId(campaign: string) {
  if (!campaign.trim()) return;

  isSettingId.value = true;
  try {
    await $fetch(`/api/email/${props.emailId}/set-email-id`, {
      method: "PUT",
      body: { emailId: campaign.trim() },
    });

    toast.success("Email ID Updated", {
      description: `Email ID has been set to "${campaign}"`,
    });

    emit("updated", campaign);
    showDialog.value = false;
    selectedCampaign.value = "";
    await refreshCampaigns();
  } catch (error) {
    console.error("Failed to set email ID:", error);
    toast.error("Failed to update Email ID", {
      description: "Please try again.",
    });
  } finally {
    isSettingId.value = false;
  }
}

function handleCampaignSelect(campaign: string) {
  selectedCampaign.value = campaign;
}
</script>

<template>
  <div v-if="campaignData">
    <!-- Show warning when multiple campaigns are found -->
    <Card v-if="campaignData.hasMultipleCampaigns && !currentEmailId" class="border-yellow-200 bg-yellow-50">
      <CardHeader class="pb-3">
        <div class="flex items-center space-x-2">
          <Icon name="lucide:alert-triangle" class="h-5 w-5 text-yellow-600" />
          <CardTitle class="text-yellow-800">Multiple UTM Campaigns Found</CardTitle>
        </div>
        <CardDescription class="text-yellow-700">
          This email contains multiple utm_campaign values, which may indicate an issue that needs to be fixed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div>
            <Label class="text-sm font-medium text-yellow-800">Available Campaigns:</Label>
            <ul class="mt-1 space-y-1">
              <li v-for="campaign in campaignData.availableCampaigns" :key="campaign" class="text-sm text-yellow-700">
                • {{ campaign }}
              </li>
            </ul>
          </div>

          <Dialog v-model:open="showDialog">
            <DialogTrigger as-child>
              <Button variant="outline" class="border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                <Icon name="lucide:settings" class="mr-2 h-4 w-4" />
                Select Email ID
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Email ID</DialogTitle>
                <DialogDescription>
                  Choose which utm_campaign value should be used as the Email ID for tracking.
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label>Available Campaigns:</Label>
                  <div class="space-y-2">
                    <div
                      v-for="campaign in campaignData.availableCampaigns"
                      :key="campaign"
                      class="flex items-center space-x-2"
                    >
                      <input
                        :id="`campaign-${campaign}`"
                        v-model="selectedCampaign"
                        type="radio"
                        :value="campaign"
                        class="h-4 w-4 text-primary focus:ring-primary border-input"
                        @change="handleCampaignSelect(campaign)"
                      >
                      <Label :for="`campaign-${campaign}`" class="text-sm font-mono">
                        {{ campaign }}
                      </Label>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end space-x-2">
                  <Button variant="outline" @click="showDialog = false">
                    Cancel
                  </Button>
                  <Button
                    :disabled="!selectedCampaign || isSettingId"
                    @click="setEmailId(selectedCampaign)"
                  >
                    {{ isSettingId ? 'Setting...' : 'Set Email ID' }}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>

    <!-- Show info when no campaigns are found -->
    <Card v-else-if="campaignData.hasNoCampaigns && !currentEmailId" class="border-blue-200 bg-blue-50">
      <CardHeader class="pb-3">
        <div class="flex items-center space-x-2">
          <Icon name="lucide:info" class="h-5 w-5 text-blue-600" />
          <CardTitle class="text-blue-800">No UTM Campaign Found</CardTitle>
        </div>
        <CardDescription class="text-blue-700">
          This email doesn't contain any utm_campaign parameters in its links.
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
</template>