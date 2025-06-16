<script setup lang="ts">
import type { Email } from "~/types/Email";

type Props = {
  emails: Email[];
};
defineProps<Props>();
</script>

<template>
  <ul role="list" class="divide-y divide-gray-100">
    <EmailListItem
      v-for="email in emails"
      :key="email.id"
      :email="email"
    />
  </ul>
</template>
