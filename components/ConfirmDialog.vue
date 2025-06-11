<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type Emits = {
  (e: "confirm"): void;
  (e: "cancel"): void;
};

withDefaults(defineProps<Props>(), {
  title: "Are you absolutely sure?",
  description: "This action cannot be undone. This will permanently delete your account and remove your data from our servers.",
  confirmText: "Continue",
  cancelText: "Cancel",
});

const emit = defineEmits<Emits>();
</script>

<template>
  <AlertDialog>
    <AlertDialogTrigger>
      <slot name="trigger" />
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('cancel')">
          {{ cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')">
          {{ confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
