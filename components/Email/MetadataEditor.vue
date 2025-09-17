<script setup lang="ts">
import { toast } from "vue-sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const props = defineProps<{
  emailId: number;
  currentEmailId?: string | null;
  currentSubject?: string | null;
}>();

const emit = defineEmits<{
  updated: [data: { emailId?: string | null; subject?: string | null }];
}>();

const isOpen = ref(false);
const isUpdating = ref(false);
const emailIdValue = ref("");
const subjectValue = ref("");

// Initialize form values when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    emailIdValue.value = props.currentEmailId || "";
    subjectValue.value = props.currentSubject || "";
  }
});

const updateMetadataSchema = z.object({
  emailId: z.string().optional(),
  subject: z.string().optional(),
}).refine(data => {
  const emailIdChanged = data.emailId !== (props.currentEmailId || "");
  const subjectChanged = data.subject !== (props.currentSubject || "");
  return emailIdChanged || subjectChanged;
}, {
  message: "At least one field must be changed",
});

async function updateMetadata() {
  try {
    const updateData = {
      emailId: emailIdValue.value,
      subject: subjectValue.value,
    };

    // Validate that something has changed
    const validation = updateMetadataSchema.safeParse(updateData);
    if (!validation.success) {
      toast.error("No changes detected", {
        description: "Please modify at least one field before saving.",
      });
      return;
    }

    isUpdating.value = true;

    await $fetch(`/api/email/${props.emailId}/update-metadata`, {
      method: "PUT",
      body: updateData,
    });

    toast.success("Email metadata updated", {
      description: "Email ID and subject have been updated successfully.",
    });

    emit("updated", {
      emailId: emailIdValue.value || null,
      subject: subjectValue.value || null,
    });

    isOpen.value = false;
  } catch (error) {
    console.error("Failed to update metadata:", error);
    toast.error("Failed to update metadata", {
      description: "Please try again later.",
    });
  } finally {
    isUpdating.value = false;
  }
}

function resetForm() {
  emailIdValue.value = props.currentEmailId || "";
  subjectValue.value = props.currentSubject || "";
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="sm">
        <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
        Edit
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Email Metadata</DialogTitle>
        <DialogDescription>
          Update the email ID and subject for this email.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="email-id">Email ID</Label>
          <Input
            id="email-id"
            v-model="emailIdValue"
            placeholder="Enter email ID (e.g., TNC_DAY_8)"
            class="w-full"
          />
          <p class="text-xs text-muted-foreground">
            Used for tracking and PDF filename generation
          </p>
        </div>

        <div class="space-y-2">
          <Label for="subject">Subject</Label>
          <Input
            id="subject"
            v-model="subjectValue"
            placeholder="Enter email subject"
            class="w-full"
          />
          <p class="text-xs text-muted-foreground">
            Display subject for this email
          </p>
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <Button variant="outline" @click="resetForm">
            Reset
          </Button>
          <Button variant="outline" @click="isOpen = false">
            Cancel
          </Button>
          <Button
            :disabled="isUpdating"
            @click="updateMetadata"
          >
            {{ isUpdating ? 'Updating...' : 'Update' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>