import { ipcMain, dialog, app, BrowserWindow } from "electron";
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { readFile, mkdir, writeFile, copyFile, rm } from "fs/promises";
import { join, basename, dirname } from "path";
import { pathToFileURL } from "url";
import { simpleParser } from "mailparser";
import { analyzeEmailContent, AnalysisProgressCallback } from "./utils/email-analyzer";
import { BrowserManager, getChromiumExecutablePath } from "./utils/browser-manager";
import { generatePdfReport, generatePdfPreviewHtml } from "./utils/pdf-generator";
import { checkSpelling } from "./utils/spell-checker";
import { getErrorMessage } from "../types/utils";
import type {
  NewEmail,
  NewLink,
  NewImage,
  NewQANote,
  Email,
  Link,
  Image,
  QAChecklistItem,
} from "../lib/db/schema";

/**
 * Convert absolute file paths to file:// URLs for use in renderer process
 */
function filePathToUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  return pathToFileURL(filePath).href;
}

export function setupIPCHandlers() {
  const browserManager = new BrowserManager();

  // ==================== Browser Management ====================
  ipcMain.handle("browser:isInstalled", async () => {
    try {
      const installed = browserManager.isBrowserInstalled();
      return { success: true, data: installed };
    } catch (error: unknown) {
      console.error("[IPC] browser:isInstalled error:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("browser:install", async (event) => {
    try {
      await browserManager.installBrowser((progress) => {
        // Send progress updates to renderer
        event.sender.send("browser:installProgress", progress);
      });
      return { success: true, message: "Browser installed successfully" };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== Email Operations ====================
  ipcMain.handle("db:getEmails", async () => {
    try {
      const emails = await db.query.emails.findMany({
        orderBy: (emails, { desc }) => [desc(emails.createdAt)],
      });
      return { success: true, data: emails };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:getEmail", async (_event, id: number) => {
    try {
      const email = await db.query.emails.findFirst({
        where: eq(schema.emails.id, id),
        with: {
          links: true,
          images: true,
          spellErrors: true,
          qaChecklist: true,
          qaNotes: true,
          attachments: true,
        },
      });
      return { success: true, data: email };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:createEmail", async (_event, data: NewEmail) => {
    try {
      const [email] = await db.insert(schema.emails).values(data).returning();
      return { success: true, data: email };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:updateEmail", async (_event, id: number, data: Partial<Email>) => {
    try {
      const [email] = await db
        .update(schema.emails)
        .set(data)
        .where(eq(schema.emails.id, id))
        .returning();
      return { success: true, data: email };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("email:getUtmCampaigns", async (_event, emailId: number) => {
    try {
      const links = await db.query.links.findMany({
        where: eq(schema.links.emailId, emailId),
      });

      const campaigns = new Set<string>();
      for (const link of links) {
        if (link.utmParams && typeof link.utmParams === 'object') {
          const params = link.utmParams as Record<string, string>;
          if (params.utm_campaign) {
            campaigns.add(params.utm_campaign);
          }
        }
      }

      const availableCampaigns = Array.from(campaigns);

      return {
        success: true,
        data: {
          availableCampaigns,
          hasMultipleCampaigns: availableCampaigns.length > 1,
          hasNoCampaigns: availableCampaigns.length === 0,
        },
      };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("email:setEmailId", async (_event, id: number, emailId: string) => {
    try {
      const [email] = await db
        .update(schema.emails)
        .set({ emailId })
        .where(eq(schema.emails.id, id))
        .returning();
      return { success: true, data: email };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:deleteEmail", async (_event, id: number) => {
    try {
      // Get email to clean up associated files
      const email = await db.query.emails.findFirst({
        where: eq(schema.emails.id, id),
      });

      if (email) {
        // Clean up screenshot directory
        if (email.screenshotDesktopUrl) {
          try {
            const screenshotDir = dirname(email.screenshotDesktopUrl);
            await rm(screenshotDir, { recursive: true, force: true });
          } catch (error) {
            console.error("Failed to delete screenshot directory:", error);
          }
        }

        // Clean up email file
        if (email.filePath) {
          try {
            await rm(email.filePath, { force: true });
          } catch (error) {
            console.error("Failed to delete email file:", error);
          }
        }
      }

      await db.delete(schema.emails).where(eq(schema.emails.id, id));
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== Link Operations ====================
  ipcMain.handle("db:getLinks", async (_event, emailId: number) => {
    try {
      const links = await db.query.links.findMany({
        where: eq(schema.links.emailId, emailId),
      });
      return { success: true, data: links };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:updateLink", async (_event, id: number, data: Partial<Link>) => {
    try {
      const [link] = await db
        .update(schema.links)
        .set(data)
        .where(eq(schema.links.id, id))
        .returning();
      return { success: true, data: link };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:createLinks", async (_event, links: NewLink[]) => {
    try {
      const createdLinks = await db.insert(schema.links).values(links).returning();
      return { success: true, data: createdLinks };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== Image Operations ====================
  ipcMain.handle("db:getImages", async (_event, emailId: number) => {
    try {
      const images = await db.query.images.findMany({
        where: eq(schema.images.emailId, emailId),
      });
      return { success: true, data: images };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:updateImage", async (_event, id: number, data: Partial<Image>) => {
    try {
      const [image] = await db
        .update(schema.images)
        .set(data)
        .where(eq(schema.images.id, id))
        .returning();
      return { success: true, data: image };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:createImages", async (_event, images: NewImage[]) => {
    try {
      const createdImages = await db.insert(schema.images).values(images).returning();
      return { success: true, data: createdImages };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== QA Checklist Operations ====================
  ipcMain.handle("db:getQAChecklist", async (_event, emailId: number) => {
    try {
      const checklist = await db.query.qaChecklist.findMany({
        where: eq(schema.qaChecklist.emailId, emailId),
      });
      return { success: true, data: checklist };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:updateQAChecklistItem", async (_event, id: number, data: Partial<QAChecklistItem>) => {
    try {
      const [item] = await db
        .update(schema.qaChecklist)
        .set(data)
        .where(eq(schema.qaChecklist.id, id))
        .returning();
      return { success: true, data: item };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== QA Notes Operations ====================
  ipcMain.handle("db:getQANotes", async (_event, emailId: number) => {
    try {
      const notes = await db.query.qaNotes.findMany({
        where: eq(schema.qaNotes.emailId, emailId),
      });
      return { success: true, data: notes };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:createQANote", async (_event, data: NewQANote) => {
    try {
      const [note] = await db.insert(schema.qaNotes).values(data).returning();
      return { success: true, data: note };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:deleteQANote", async (_event, id: number) => {
    try {
      await db.delete(schema.qaNotes).where(eq(schema.qaNotes.id, id));
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== Attachments Operations ====================
  ipcMain.handle("db:getAttachments", async (_event, emailId: number) => {
    try {
      const emailAttachments = await db.query.attachments.findMany({
        where: eq(schema.attachments.emailId, emailId),
        orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
      });

      // Convert file paths to data URLs for renderer
      const attachmentsWithData = await Promise.all(
        emailAttachments.map(async (attachment) => {
          try {
            const fileBuffer = await readFile(attachment.path);
            const base64 = fileBuffer.toString("base64");
            return {
              ...attachment,
              dataUrl: `data:${attachment.mimeType};base64,${base64}`,
            };
          } catch (error) {
            console.error(`Failed to read attachment ${attachment.id}:`, error);
            return attachment;
          }
        })
      );

      return { success: true, data: attachmentsWithData };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("file:selectAttachments", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
          { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      return {
        success: true,
        data: result.canceled ? [] : result.filePaths,
      };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:createAttachments", async (_event, emailId: number, filePaths: string[], description?: string, type?: string) => {
    try {
      // Validate file types (images only)
      const allowedTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

      for (const filePath of filePaths) {
        const ext = filePath.toLowerCase().split('.').pop();
        if (!ext || !allowedTypes.includes(`.${ext}`)) {
          return {
            success: false,
            error: `Invalid file type: ${ext}. Only images (JPG, PNG, GIF, WebP) are allowed.`,
          };
        }
      }

      // Create uploads directory in userData
      const userDataPath = app.getPath("userData");
      const uploadsDir = join(userDataPath, "uploads", "attachments");
      await mkdir(uploadsDir, { recursive: true });

      const uploadedAttachments = [];

      for (const filePath of filePaths) {
        // Validate file size (max 10MB)
        const fileBuffer = await readFile(filePath);
        if (fileBuffer.length > 10 * 1024 * 1024) {
          return {
            success: false,
            error: "File too large. Maximum size is 10MB.",
          };
        }

        // Create unique filename
        const timestamp = Date.now();
        const originalName = basename(filePath);
        const fileExt = originalName.split('.').pop();
        const uniqueFilename = `attachment-${emailId}-${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const destPath = join(uploadsDir, uniqueFilename);

        // Copy file
        await copyFile(filePath, destPath);

        // Determine MIME type
        let mimeType = "application/octet-stream";
        const ext = fileExt?.toLowerCase();
        if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
        else if (ext === "png") mimeType = "image/png";
        else if (ext === "gif") mimeType = "image/gif";
        else if (ext === "webp") mimeType = "image/webp";

        // Save to database
        const [attachment] = await db
          .insert(schema.attachments)
          .values({
            emailId,
            filename: uniqueFilename,
            originalName,
            mimeType,
            size: fileBuffer.length,
            path: destPath,
            description: description || null,
            type: type || "general",
          })
          .returning();

        uploadedAttachments.push(attachment);
      }

      return {
        success: true,
        data: uploadedAttachments,
      };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:deleteAttachment", async (_event, id: number) => {
    try {
      // Get attachment to delete file
      const attachment = await db.query.attachments.findFirst({
        where: eq(schema.attachments.id, id),
      });

      if (attachment) {
        // Delete file from filesystem
        try {
          const fs = await import("fs/promises");
          await fs.unlink(attachment.path);
        } catch (error) {
          console.error("Failed to delete attachment file:", error);
        }
      }

      // Delete from database
      await db.delete(schema.attachments).where(eq(schema.attachments.id, id));
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== Spell Error Operations ====================
  ipcMain.handle("db:getSpellErrors", async (_event, emailId: number) => {
    try {
      const errors = await db.query.spellErrors.findMany({
        where: eq(schema.spellErrors.emailId, emailId),
      });
      return { success: true, data: errors };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("db:deleteSpellError", async (_event, id: number) => {
    try {
      await db.delete(schema.spellErrors).where(eq(schema.spellErrors.id, id));
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== File Operations ====================
  ipcMain.handle("file:select", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "Email Files", extensions: ["eml", "html", "htm"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      return {
        success: true,
        data: result.canceled ? null : result.filePaths[0],
      };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("file:getImageData", async (_event, filePath: string) => {
    try {
      // Read file and convert to base64
      const fileBuffer = await readFile(filePath);
      const base64 = fileBuffer.toString("base64");

      // Determine MIME type from extension
      const ext = filePath.split(".").pop()?.toLowerCase();
      let mimeType = "image/png";
      if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "webp") mimeType = "image/webp";

      return {
        success: true,
        data: `data:${mimeType};base64,${base64}`,
      };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("email:upload", async (_event, filePath: string) => {
    try {
      // Create uploads directory in userData
      const userDataPath = app.getPath("userData");
      const uploadsDir = join(userDataPath, "uploads", "emails");
      await mkdir(uploadsDir, { recursive: true });

      // Get filename and copy file to uploads directory
      const filename = basename(filePath);
      const destPath = join(uploadsDir, filename);
      await copyFile(filePath, destPath);

      // Create default checklist items
      const defaultChecklistItems = [
        { id: "1", text: "Subject line is clear and accurate" },
        { id: "2", text: "Preheader text is optimized" },
        { id: "3", text: "All links are working correctly" },
        { id: "4", text: "Images are displaying properly" },
        { id: "5", text: "No spelling or grammar errors" },
        { id: "6", text: "Email renders correctly in all clients" },
        { id: "7", text: "Personalization tokens are correct" },
        { id: "8", text: "Unsubscribe link is present and working" },
      ];

      // Create email record in database
      const [newEmail] = await db
        .insert(schema.emails)
        .values({
          filename,
          filePath: destPath,
          subject: null, // Will be extracted during analysis
        })
        .returning();

      // Create default QA checklist items
      const checklistItems = defaultChecklistItems.map((item) => ({
        emailId: newEmail.id,
        itemId: item.id,
        itemText: item.text,
        completed: false,
        note: null,
      }));

      await db.insert(schema.qaChecklist).values(checklistItems);

      return {
        success: true,
        message: `Email "${filename}" uploaded successfully`,
        emailId: newEmail.id,
      };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("email:analyze", async (event, emailId: number) => {
    try {
      // Get the window to send progress updates
      const win = BrowserWindow.fromWebContents(event.sender);

      // Progress callback to send updates to renderer
      const onProgress: AnalysisProgressCallback = (progress) => {
        win?.webContents.send("email:analysisProgress", progress);
      };

      // Get email from database
      const email = await db.query.emails.findFirst({
        where: eq(schema.emails.id, emailId),
      });

      if (!email) {
        return { success: false, error: "Email not found" };
      }

      // Read and parse email file
      onProgress({ stage: 'parsing', message: 'Parsing email file...' });
      const fileContent = await readFile(email.filePath);
      const parsed = await simpleParser(fileContent);

      // Extract HTML content
      const htmlContent = parsed.html || parsed.textAsHtml || "";
      if (!htmlContent) {
        return { success: false, error: "No HTML content found in email" };
      }

      // Analyze email with Playwright
      const analysis = await analyzeEmailContent(emailId, htmlContent, onProgress);

      // Extract subject from parsed email
      const subject = parsed.subject || null;

      // Extract emailId from UTM campaigns
      let extractedEmailId: string | null = null;
      const utmCampaigns = new Set<string>();

      for (const link of analysis.links) {
        if (link.utmParams && link.utmParams.utm_campaign) {
          utmCampaigns.add(link.utmParams.utm_campaign);
        }
      }

      if (utmCampaigns.size === 1) {
        extractedEmailId = Array.from(utmCampaigns)[0];
      } else if (utmCampaigns.size > 1) {
        console.warn(
          `Multiple UTM campaigns found for email ${emailId}:`,
          Array.from(utmCampaigns)
        );
      }

      // Update email record
      await db
        .update(schema.emails)
        .set({
          analyzed: true,
          subject,
          emailId: extractedEmailId,
          screenshotDesktopUrl: analysis.screenshotDesktopUrl,
          screenshotMobileUrl: analysis.screenshotMobileUrl,
        })
        .where(eq(schema.emails.id, emailId));

      // Insert links
      if (analysis.links.length > 0) {
        const linkRecords = analysis.links.map((link) => ({
          emailId,
          text: link.text,
          url: link.url,
          status: link.status,
          redirectChain: link.redirectChain,
          finalUrl: link.finalUrl,
          utmParams: link.utmParams,
          screenshotPath: link.screenshotPath,
        }));
        await db.insert(schema.links).values(linkRecords);
      }

      // Insert images
      if (analysis.images.length > 0) {
        const imageRecords = analysis.images.map((image) => ({
          emailId,
          src: image.src,
          alt: image.alt,
          status: image.status,
          width: image.width,
          height: image.height,
        }));
        await db.insert(schema.images).values(imageRecords);
      }

      // Run spell check on email HTML
      onProgress({ stage: 'parsing', message: 'Running spell check...' });
      let spellErrorsCount = 0;
      try {
        const spellCheckResult = await checkSpelling(htmlContent);
        if (spellCheckResult.errors.length > 0) {
          const spellErrorRecords = spellCheckResult.errors.map((error) => ({
            emailId,
            word: error.word,
            position: error.position,
            suggestions: error.suggestions.join(", "),
            context: error.context,
          }));
          await db.insert(schema.spellErrors).values(spellErrorRecords);
          spellErrorsCount = spellCheckResult.errors.length;
        }
      } catch (spellError) {
        console.error("Spell check failed:", spellError);
        // Continue without spell check results
      }

      return {
        success: true,
        message: "Email analyzed successfully",
        data: {
          linksCount: analysis.links.length,
          imagesCount: analysis.images.length,
          spellErrorsCount,
          subject,
          emailId: extractedEmailId,
        },
      };
    } catch (error: unknown) {
      console.error("Email analysis failed:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ==================== PDF Export ====================
  ipcMain.handle("email:getPreviewHtml", async (_event, emailId: string) => {
    try {
      const userDataPath = app.getPath("userData");
      const html = await generatePdfPreviewHtml(emailId, userDataPath);
      return { success: true, data: html };
    } catch (error: unknown) {
      console.error("PDF preview failed:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("email:exportPdf", async (_event, emailId: string) => {
    let browser = null;

    try {
      // Get email to check if it exists and is analyzed
      const email = await db.query.emails.findFirst({
        where: eq(schema.emails.id, emailId),
      });

      if (!email) {
        return { success: false, error: "Email not found" };
      }

      if (!email.analyzed) {
        return {
          success: false,
          error: "Email must be analyzed before exporting. Please analyze the email first.",
        };
      }

      // Show save dialog
      const filename = email.emailId ? `${email.emailId}-qa.pdf` : `${emailId}-qa.pdf`;
      const result = await dialog.showSaveDialog({
        title: "Export PDF Report",
        defaultPath: filename,
        filters: [{ name: "PDF Files", extensions: ["pdf"] }],
      });

      // User cancelled
      if (result.canceled || !result.filePath) {
        return { success: false, error: "Export cancelled" };
      }

      // Launch browser for PDF generation
      const { chromium } = await import("playwright");
      browser = await chromium.launch({
        headless: true,
        executablePath: getChromiumExecutablePath()
      });
      const page = await browser.newPage();

      try {
        // Generate PDF
        const userDataPath = app.getPath("userData");
        const pdfBuffer = await generatePdfReport(emailId, page, userDataPath);

        // Write PDF to selected file path
        await writeFile(result.filePath, pdfBuffer);

        return {
          success: true,
          data: { filePath: result.filePath },
        };
      } finally {
        // Clean up page
        await page.close();
      }
    } catch (error: unknown) {
      console.error("PDF export failed:", error);
      return { success: false, error: getErrorMessage(error) };
    } finally {
      // Clean up browser
      if (browser) {
        await browser.close();
      }
    }
  });
}
