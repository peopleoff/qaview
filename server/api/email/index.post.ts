import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod/v4";

import db from "@/lib/db/index";
import { emails, qaChecklist } from "@/lib/db/schema/index";
import { createEmailSchema, defaultChecklistItems } from "~/lib/validations";

const multipartItemSchema = z.object({
  name: z.string(),
  data: z.instanceof(Buffer),
  filename: z.string().optional(),
});

const extractedDataSchema = z.object({
  email: z.string().min(1, "Email name is required"),
  file: z.object({
    filename: z.string().min(1, "Filename is required"),
    data: z.instanceof(Buffer),
  }),
});

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);

  // Validate that we have form data
  const validatedFormData = z.array(multipartItemSchema).parse(formData);

  // Extract data from the multipart form data array
  let email = "";
  let file: { filename?: string; data: Buffer } | null = null;

  for (const item of validatedFormData) {
    if (item.name === "email") {
      email = item.data.toString();
    }
    if (item.name === "file") {
      file = {
        filename: item.filename,
        data: item.data,
      };
    }
  }

  // Validate the extracted data with zod
  const { email: validatedEmail, file: validatedFile } = extractedDataSchema.parse({
    email,
    file,
  });

  // Create uploads folder
  const uploadsDir = join(process.cwd(), "public/uploads/emails");
  await mkdir(uploadsDir, { recursive: true });

  // Save file
  const filePath = join(uploadsDir, validatedFile.filename);
  await writeFile(filePath, validatedFile.data);

  // Validate email data before saving
  const emailData = createEmailSchema.parse({
    filename: validatedEmail,
    filePath,
    subject: null, // Will be extracted during analysis
  });

  // Save to database and get the created email
  const [newEmail] = await db.insert(emails).values({
    filename: emailData.filename,
    filePath: emailData.filePath,
    subject: emailData.subject,
  }).returning();

  // Create default QA checklist items for the new email
  const checklistItems = defaultChecklistItems.map(item => ({
    emailId: newEmail.id,
    itemId: item.id,
    itemText: item.text,
    completed: false,
    note: null,
  }));

  await db.insert(qaChecklist).values(checklistItems);

  return {
    success: true,
    message: `Email "${validatedEmail}" uploaded successfully`,
    emailId: newEmail.id,
  };
});
