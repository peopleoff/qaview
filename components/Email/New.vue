<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function handleSubmit(values: { email: string; file: File }) {
  uploadFile(values.email, values.file);
}

async function uploadFile(fileName: string, file: File) {
  const formData = new FormData();
  formData.append("email", fileName);
  formData.append("file", file);

  await $fetch("/api/email", {
    method: "POST",
    body: formData,
  });
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline">
        New Email
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>New Email</DialogTitle>
        <DialogDescription>
          QA a new email.
        </DialogDescription>
      </DialogHeader>
      <FormNewQa @submit="handleSubmit">
        <template #submit>
          <DialogFooter>
            <Button type="submit">
              Save changes
            </Button>
          </DialogFooter>
        </template>
      </FormNewQa>
    </DialogContent>
  </Dialog>
</template>
