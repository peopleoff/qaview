<script setup lang="ts">
import { z } from "zod";

import type { Link } from "@/types/Email";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  link: Link | null;
};

type Emits = {
  (e: "update:open", value: boolean): void;
  (e: "updated", link: Link): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editSchema = z.object({
  text: z.string().min(1, "Link text is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  finalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.number().min(0).max(599).optional(),
});

const form = ref({
  text: "",
  url: "",
  finalUrl: "",
  status: 0,
});

const selectedFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const imageRemoved = ref(false);

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

watch(() => props.link, (newLink) => {
  if (newLink) {
    form.value = {
      text: newLink.text || "",
      url: newLink.url || "",
      finalUrl: newLink.finalUrl || "",
      status: newLink.status || 0,
    };
    // Set image preview from existing screenshot
    if (newLink.screenshotPath && newLink.emailId) {
      imagePreview.value = `/uploads/analysis/email-${newLink.emailId}/${newLink.screenshotPath}`;
    }
    else {
      imagePreview.value = null;
    }
    selectedFile.value = null;
    imageRemoved.value = false;
    errors.value = {};
  }
}, { immediate: true });

function closeDialog() {
  emit("update:open", false);
  selectedFile.value = null;
  imagePreview.value = null;
  imageRemoved.value = false;
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    if (!file.type.startsWith("image/")) {
      errors.value.file = "Please select an image file";
      return;
    }

    selectedFile.value = file;
    imageRemoved.value = false;
    errors.value.file = "";

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  selectedFile.value = null;
  imagePreview.value = null;
  imageRemoved.value = true;
  const fileInput = document.getElementById("screenshot-upload") as HTMLInputElement;
  if (fileInput) {
    fileInput.value = "";
  }
}

async function handleSubmit() {
  if (!props.link)
    return;

  try {
    isSubmitting.value = true;
    errors.value = {};

    const validatedData = editSchema.parse({
      text: form.value.text,
      url: form.value.url || undefined,
      finalUrl: form.value.finalUrl || undefined,
      status: form.value.status,
    });

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("data", JSON.stringify(validatedData));

    if (selectedFile.value) {
      formData.append("screenshot", selectedFile.value);
    }

    if (imageRemoved.value) {
      formData.append("removeImage", "true");
    }

    const response = await $fetch(`/api/link/${props.link.id}`, {
      method: "PUT",
      body: formData,
    });

    emit("updated", response);
    closeDialog();
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors.value[err.path[0] as string] = err.message;
        }
      });
    }
    else {
      console.error("Failed to update link:", error);
    }
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Link</DialogTitle>
        <DialogDescription>
          Update the link details.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="text">Link Text</Label>
          <Input
            id="text"
            v-model="form.text"
            placeholder="Enter link text"
            :class="errors.text ? 'border-red-500' : ''"
          />
          <p v-if="errors.text" class="text-sm text-red-500">
            {{ errors.text }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="url">Original URL</Label>
          <Input
            id="url"
            v-model="form.url"
            placeholder="Enter original URL"
            :class="errors.url ? 'border-red-500' : ''"
          />
          <p v-if="errors.url" class="text-sm text-red-500">
            {{ errors.url }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="finalUrl">Final URL</Label>
          <Input
            id="finalUrl"
            v-model="form.finalUrl"
            placeholder="Enter final URL"
            :class="errors.finalUrl ? 'border-red-500' : ''"
          />
          <p v-if="errors.finalUrl" class="text-sm text-red-500">
            {{ errors.finalUrl }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="status">Status Code</Label>
          <Input
            id="status"
            v-model.number="form.status"
            type="number"
            placeholder="0"
            min="0"
            max="599"
            :class="errors.status ? 'border-red-500' : ''"
          />
          <p v-if="errors.status" class="text-sm text-red-500">
            {{ errors.status }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="screenshot-upload">Screenshot</Label>
          <div class="space-y-3">
            <Input
              id="screenshot-upload"
              type="file"
              accept="image/*"
              :class="errors.file ? 'border-red-500' : ''"
              @change="handleFileSelect"
            />
            <p v-if="errors.file" class="text-sm text-red-500">
              {{ errors.file }}
            </p>

            <!-- Image Preview -->
            <div v-if="imagePreview" class="relative">
              <img
                :src="imagePreview"
                alt="Screenshot preview"
                class="w-full max-w-xs h-32 object-contain border rounded-lg"
              >
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="absolute top-2 right-2"
                @click="removeImage"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          @click="closeDialog"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? "Saving..." : "Save Changes" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
