<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type Emits = {
  (e: "submit", values: { email: string; file: File }): void;
};

const emit = defineEmits<Emits>();

const formSchema = toTypedSchema(z.object({
  email: z.string().min(2).max(50),
  file: z.instanceof(File),
}));

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
});

const onSubmit = handleSubmit((values) => {
  emit("submit", values);
});

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    setFieldValue("file", file);
  }
}
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="email">
      <FormItem v-auto-animate>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="shadcn"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="file">
      <FormItem v-auto-animate>
        <FormLabel>File</FormLabel>
        <FormControl>
          <Input
            type="file"
            :name="componentField.name"
            @change="handleFileChange"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <slot name="submit" />
  </form>
</template>
