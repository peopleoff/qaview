<script lang="ts" setup>
import { Switch } from "@/components/ui/switch";

const colorMode = useColorMode();

const isDark = computed({
  get: () => colorMode.value === "dark",
  set: (value) => {
    colorMode.preference = value ? "dark" : "light";
  },
});
</script>

<template>
  <Switch :model-value="isDark" @update:model-value="isDark = !isDark">
    <template #thumb>
      <Icon
        v-if="isDark"
        name="tabler:sun"
        class="swap-on fill-current"
        size="16"
      />
      <Icon
        v-else
        name="tabler:moon"
        class="swap-off fill-current"
        size="16"
      />
    </template>
  </Switch>
</template>
