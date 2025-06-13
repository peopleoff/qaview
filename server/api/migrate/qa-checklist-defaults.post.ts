import db from "@/lib/db/index";
import { qaChecklist } from "@/lib/db/schema/index";
import { defaultChecklistItems } from "~/lib/validations";

export default defineEventHandler(async () => {
  try {
    // Get all emails
    const allEmails = await db.query.emails.findMany({
      with: {
        qaChecklist: true,
      },
    });

    let migratedCount = 0;
    let skippedCount = 0;

    for (const email of allEmails) {
      // Check if this email already has checklist items
      if (email.qaChecklist && email.qaChecklist.length > 0) {
        // Check if it has all default items
        const existingItemIds = new Set(email.qaChecklist.map(item => item.itemId));
        const missingItems = defaultChecklistItems.filter(item => !existingItemIds.has(item.id));

        if (missingItems.length > 0) {
          // Add missing default items
          const newItems = missingItems.map(item => ({
            emailId: email.id,
            itemId: item.id,
            itemText: item.text,
            completed: false,
            note: null,
          }));

          await db.insert(qaChecklist).values(newItems);
          migratedCount++;
        }
        else {
          skippedCount++;
        }
      }
      else {
        // No checklist items exist, create all default items
        const checklistItems = defaultChecklistItems.map(item => ({
          emailId: email.id,
          itemId: item.id,
          itemText: item.text,
          completed: false,
          note: null,
        }));

        await db.insert(qaChecklist).values(checklistItems);
        migratedCount++;
      }
    }

    return {
      success: true,
      message: `Migration completed. ${migratedCount} emails migrated, ${skippedCount} emails already had complete checklists.`,
      migrated: migratedCount,
      skipped: skippedCount,
      total: allEmails.length,
    };
  }
  catch (error) {
    console.error("Migration failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to migrate QA checklist defaults",
    });
  }
});
