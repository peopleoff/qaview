<script setup lang="ts">
import type { Email } from "~/types/Email";

type Props = {
  email: Email;
};
defineProps<Props>();
</script>

<template>
  <NuxtLink :to="`/email/${email.id}`">
    <li class="flex justify-between gap-x-6 py-5">
      <div class="flex min-w-0 gap-x-4">
        <div class="min-w-0 flex-auto">
          <p class="text-sm/6 font-semibold text-muted-foreground">
            {{ email.filename }}
          </p>
          <p class="mt-1 truncate text-xs/5 text-muted-foreground">
            {{ email.filePath }}
          </p>
        </div>
      </div>
      <div class="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
        <p class="text-sm/6 text-muted-foreground">
          {{ email.analyzed }}
        </p>
      </div>
    </li>
  </NuxtLink>
</template>
