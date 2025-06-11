<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { Primitive } from "reka-ui";

import { cn } from "@/lib/utils";

import type { ButtonVariants } from ".";

import { buttonVariants } from ".";

type Props = {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  isLoading?: boolean;
} & PrimitiveProps;

const props = withDefaults(defineProps<Props>(), {
  as: "button",
});
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="isLoading"
  >
    <slot />
    <Icon v-if="isLoading" name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
  </Primitive>
</template>
