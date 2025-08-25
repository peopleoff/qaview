<script lang="ts" setup>
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const { emails, fetchEmails } = useEmails();

// Initialize data
await fetchEmails();

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

async function deleteEmail(id: string) {
  await $fetch(`/api/email/${id}`, {
    method: "DELETE",
  });
  await fetchEmails();
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-background border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground">
              QAView
            </h1>
            <p class="mt-2 text-muted-foreground">
              Email quality assurance analysis tool
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Analysis History</CardTitle>
          <CardDescription>
            View and manage your analyzed emails. Click on any email to view detailed analysis results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="emails && emails.length > 0">
            <Table>
              <TableCaption>
                {{ emails.length }} email{{ emails.length !== 1 ? 's' : '' }} total
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Email ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="email in emails"
                  :key="email.id"
                  class="hover:bg-muted/50"
                >
                  <TableCell class="font-semibold max-w-48 truncate">
                    <NuxtLink :to="`/email/${email.id}`" class="underline">
                      {{ email.emailId || 'No ID' }}
                    </NuxtLink>
                  </TableCell>
                  <TableCell class="font-medium max-w-48 truncate">
                    {{ email.subject || 'No subject' }}
                  </TableCell>
                  <TableCell class="text-muted-foreground max-w-48 truncate">
                    {{ email.filename }}
                  </TableCell>
                  <TableCell class="max-w-24 truncate">
                    <Badge :variant="email.analyzed ? 'default' : 'secondary'">
                      {{ email.analyzed ? 'Analyzed' : 'Pending' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground">
                    {{ formatDate(email.createdAt) }}
                  </TableCell>
                  <TableCell class="flex gap-2">
                    <NuxtLink
                      v-if="email.analyzed"
                      :to="`/email/${email.id}/download`"
                      target="_blank"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                      >
                        <Icon name="lucide:download" class="text-foreground" />
                        <span class="sr-only">Download</span>
                      </Button>
                    </NuxtLink>
                    <ConfirmDialog
                      title="Delete Email"
                      description="This action cannot be undone. This will permanently delete the email."
                      confirm-text="Delete"
                      @confirm="deleteEmail(email.id)"
                    >
                      <template #trigger>
                        <Button
                          variant="outline"
                          size="icon"
                        >
                          <Icon name="lucide:trash-2" class="text-destructive" />
                          <span class="sr-only">Delete</span>
                        </Button>
                      </template>
                    </ConfirmDialog>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="text-center py-4 space-y-2">
            <Icon name="lucide:inbox" class="mx-auto size-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">
              No emails yet
            </h3>
            <p class="text-muted-foreground">
              Get started by uploading your first email for analysis.
            </p>
            <EmailNew />
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
