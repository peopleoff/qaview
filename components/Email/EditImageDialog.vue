<script setup lang="ts">
import { z } from "zod";

import type { Image } from "@/types/Email";

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
  image: Image | null;
};

type Emits = {
  (e: "update:open", value: boolean): void;
  (e: "updated", image: Image): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editSchema = z.object({
  alt: z.string().min(1, "Alt text is required"),
  src: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  width: z.number().min(1, "Width must be greater than 0").optional(),
  height: z.number().min(1, "Height must be greater than 0").optional(),
});

const form = ref({
  alt: "",
  src: "",
  width: 0,
  height: 0,
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

watch(() => props.image, (newImage) => {
  if (newImage) {
    form.value = {
      alt: newImage.alt || "",
      src: newImage.src || "",
      width: newImage.width || 0,
      height: newImage.height || 0,
    };
    errors.value = {};
  }
}, { immediate: true });

function closeDialog() {
  emit("update:open", false);
}

async function handleSubmit() {
  if (!props.image)
    return;

  try {
    isSubmitting.value = true;
    errors.value = {};

    const validatedData = editSchema.parse({
      alt: form.value.alt,
      src: form.value.src || undefined,
      width: form.value.width || undefined,
      height: form.value.height || undefined,
    });

    const response = await $fetch(`/api/image/${props.image.id}`, {
      method: "PUT",
      body: validatedData,
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
      console.error("Failed to update image:", error);
    }
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Image</DialogTitle>
        <DialogDescription>
          Update the image details.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="alt">Alt Text</Label>
          <Input
            id="alt"
            v-model="form.alt"
            placeholder="Enter alt text"
            :class="errors.alt ? 'border-red-500' : ''"
          />
          <p v-if="errors.alt" class="text-sm text-red-500">
            {{ errors.alt }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="src">Source URL</Label>
          <Input
            id="src"
            v-model="form.src"
            placeholder="Enter image URL"
            :class="errors.src ? 'border-red-500' : ''"
          />
          <p v-if="errors.src" class="text-sm text-red-500">
            {{ errors.src }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="width">Width</Label>
            <Input
              id="width"
              v-model.number="form.width"
              type="number"
              placeholder="Width"
              :class="errors.width ? 'border-red-500' : ''"
            />
            <p v-if="errors.width" class="text-sm text-red-500">
              {{ errors.width }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="height">Height</Label>
            <Input
              id="height"
              v-model.number="form.height"
              type="number"
              placeholder="Height"
              :class="errors.height ? 'border-red-500' : ''"
            />
            <p v-if="errors.height" class="text-sm text-red-500">
              {{ errors.height }}
            </p>
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
