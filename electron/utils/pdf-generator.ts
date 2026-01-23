import Handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Page } from 'playwright';
import { eq } from 'drizzle-orm';
import { db } from '../../lib/db/index';
import { emails } from '../../lib/db/schema/index';
import { registerTemplateHelpers } from './template-helpers';
import { PDF_LAYOUT_TEMPLATE, PDF_REPORT_TEMPLATE } from './pdf-templates';

// Register Handlebars helpers once
let helpersRegistered = false;

interface LinkStatusSummary {
  successful: number;
  redirects: number;
  failed: number;
  unknown: number;
}

interface ImageStatusSummary {
  successful: number;
  failed: number;
  unknown: number;
}

interface SpellCheckSummary {
  totalErrors: number;
  status: 'Perfect' | 'Good' | 'Needs Review';
}

interface QAChecklistSummary {
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  status: 'Not Started' | 'In Progress' | 'Nearly Complete' | 'Complete';
}

interface AttachmentWithIsImage {
  id: number;
  filename: string;
  mimeType: string | null;
  size: number;
  isImage: boolean;
}

interface PDFTemplateData {
  emailData: any;
  attachments: AttachmentWithIsImage[];
  emailPreviewDataUrl: string;
  emailDesktopDataUrl: string;
  emailMobileDataUrl: string;
  linkScreenshots: Record<string, string>;
  attachmentUrls: Record<string, string>;
  linkStatusSummary: LinkStatusSummary;
  imageStatusSummary: ImageStatusSummary;
  spellCheckSummary: SpellCheckSummary;
  qaChecklistSummary: QAChecklistSummary;
  qaNotesCount: number;
  generatedAt: string;
}

/**
 * Convert image file path to base64 data URL
 */
async function imageToDataUrl(imagePath: string, userDataPath: string): Promise<string> {
  try {
    let fullPath: string;

    // Handle absolute paths (screenshots are stored in userData)
    if (imagePath.startsWith('/')) {
      fullPath = imagePath;
    } else {
      // Relative paths are relative to userData uploads directory
      fullPath = join(userDataPath, imagePath);
    }

    const imageBuffer = await readFile(fullPath);
    const base64 = imageBuffer.toString('base64');

    // Determine MIME type from extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';
    if (extension === 'jpg' || extension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to load image: ${imagePath}`, error);
    return '';
  }
}

/**
 * Load and compile Handlebars template from embedded strings
 */
function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
  const templateSource = templateName === 'pdf-layout' ? PDF_LAYOUT_TEMPLATE : PDF_REPORT_TEMPLATE;
  return Handlebars.compile(templateSource);
}

/**
 * Generate PDF report for an email
 */
export async function generatePdfReport(
  emailId: string,
  page: Page,
  userDataPath: string
): Promise<Buffer> {
  // Register Handlebars helpers once
  if (!helpersRegistered) {
    registerTemplateHelpers();
    helpersRegistered = true;
  }

  // Fetch email data with all relationships
  const emailData = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
    with: {
      links: true,
      images: true,
      spellErrors: true,
      qaChecklist: true,
      qaNotes: true,
      attachments: true,
    },
  });

  if (!emailData) {
    throw new Error('Email not found');
  }

  if (!emailData.analyzed) {
    throw new Error('Email must be analyzed before exporting. Please analyze the email first.');
  }

  // Generate link status summary
  const linkStatusSummary: LinkStatusSummary = emailData.links.reduce(
    (acc, link) => {
      const status = link.status || 0;
      if (status >= 200 && status < 300) {
        acc.successful++;
      } else if (status >= 300 && status < 400) {
        acc.redirects++;
      } else if (status >= 400) {
        acc.failed++;
      } else {
        acc.unknown++;
      }
      return acc;
    },
    { successful: 0, redirects: 0, failed: 0, unknown: 0 }
  );

  // Generate image status summary
  const imageStatusSummary: ImageStatusSummary = emailData.images.reduce(
    (acc, image) => {
      const status = image.status || 0;
      if (status >= 200 && status < 300) {
        acc.successful++;
      } else if (status >= 400) {
        acc.failed++;
      } else {
        acc.unknown++;
      }
      return acc;
    },
    { successful: 0, failed: 0, unknown: 0 }
  );

  // Generate spell check summary
  const spellCheckSummary: SpellCheckSummary = {
    totalErrors: emailData.spellErrors?.length || 0,
    status:
      emailData.spellErrors?.length === 0
        ? 'Perfect'
        : emailData.spellErrors?.length <= 5
          ? 'Good'
          : 'Needs Review',
  };

  // Generate QA checklist summary
  const qaChecklistSummary: QAChecklistSummary = {
    totalItems: emailData.qaChecklist?.length || 0,
    completedItems: emailData.qaChecklist?.filter((item) => item.completed).length || 0,
    completionPercentage:
      emailData.qaChecklist?.length > 0
        ? Math.round(
            (emailData.qaChecklist.filter((item) => item.completed).length /
              emailData.qaChecklist.length) *
              100
          )
        : 0,
    status:
      emailData.qaChecklist?.length === 0
        ? 'Not Started'
        : emailData.qaChecklist.filter((item) => item.completed).length /
              emailData.qaChecklist.length ===
            1
          ? 'Complete'
          : emailData.qaChecklist.filter((item) => item.completed).length /
                emailData.qaChecklist.length >=
              0.75
            ? 'Nearly Complete'
            : 'In Progress',
  };

  // Convert screenshots to data URLs
  const emailDesktopDataUrl = emailData.screenshotDesktopUrl
    ? await imageToDataUrl(emailData.screenshotDesktopUrl, userDataPath)
    : '';
  const emailMobileDataUrl = emailData.screenshotMobileUrl
    ? await imageToDataUrl(emailData.screenshotMobileUrl, userDataPath)
    : '';

  // Convert link screenshots to data URLs (use string keys for Handlebars lookup compatibility)
  const linkScreenshots: Record<string, string> = {};
  for (const link of emailData.links) {
    if (link.screenshotPath) {
      linkScreenshots[String(link.id)] = await imageToDataUrl(link.screenshotPath, userDataPath);
    }
  }

  // Convert attachment images to data URLs (use string keys for Handlebars lookup compatibility)
  const attachmentUrls: Record<string, string> = {};
  for (const attachment of emailData.attachments || []) {
    if (attachment.mimeType?.startsWith('image/') && attachment.path) {
      attachmentUrls[String(attachment.id)] = await imageToDataUrl(attachment.path, userDataPath);
    }
  }

  // Transform attachments with pre-computed isImage flag for Handlebars
  const attachments: AttachmentWithIsImage[] = (emailData.attachments || []).map((attachment: any) => ({
    id: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    isImage: attachment.mimeType?.startsWith('image/') ?? false,
  }));

  // Prepare template data
  const templateData: PDFTemplateData = {
    emailData,
    attachments,
    emailPreviewDataUrl: '',
    emailDesktopDataUrl,
    emailMobileDataUrl,
    linkScreenshots,
    attachmentUrls,
    linkStatusSummary,
    imageStatusSummary,
    spellCheckSummary,
    qaChecklistSummary,
    qaNotesCount: emailData.qaNotes?.length || 0,
    generatedAt: new Date().toLocaleString(),
  };

  // Load and render templates
  const reportTemplate = loadTemplate('pdf-report');
  const layoutTemplate = loadTemplate('pdf-layout');

  const reportContent = reportTemplate(templateData);
  const htmlContent = layoutTemplate({
    ...templateData,
    body: reportContent,
  });

  // Generate PDF using Playwright
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  const pdf = await page.pdf({
    format: 'A3',
    printBackground: true,
    scale: 0.8,
    margin: {
      top: '2cm',
      right: '2cm',
      bottom: '2cm',
      left: '2cm',
    },
  });

  return pdf;
}

/**
 * Generate HTML preview for PDF report (for browser display)
 */
export async function generatePdfPreviewHtml(
  emailId: string,
  userDataPath: string
): Promise<string> {
  // Register Handlebars helpers once
  if (!helpersRegistered) {
    registerTemplateHelpers();
    helpersRegistered = true;
  }

  // Fetch email data with all relationships
  const emailData = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
    with: {
      links: true,
      images: true,
      spellErrors: true,
      qaChecklist: true,
      qaNotes: true,
      attachments: true,
    },
  });

  if (!emailData) {
    throw new Error('Email not found');
  }

  if (!emailData.analyzed) {
    throw new Error('Email must be analyzed before previewing. Please analyze the email first.');
  }

  // Generate link status summary
  const linkStatusSummary: LinkStatusSummary = emailData.links.reduce(
    (acc, link) => {
      const status = link.status || 0;
      if (status >= 200 && status < 300) {
        acc.successful++;
      } else if (status >= 300 && status < 400) {
        acc.redirects++;
      } else if (status >= 400) {
        acc.failed++;
      } else {
        acc.unknown++;
      }
      return acc;
    },
    { successful: 0, redirects: 0, failed: 0, unknown: 0 }
  );

  // Generate image status summary
  const imageStatusSummary: ImageStatusSummary = emailData.images.reduce(
    (acc, image) => {
      const status = image.status || 0;
      if (status >= 200 && status < 300) {
        acc.successful++;
      } else if (status >= 400) {
        acc.failed++;
      } else {
        acc.unknown++;
      }
      return acc;
    },
    { successful: 0, failed: 0, unknown: 0 }
  );

  // Generate spell check summary
  const spellCheckSummary: SpellCheckSummary = {
    totalErrors: emailData.spellErrors?.length || 0,
    status:
      emailData.spellErrors?.length === 0
        ? 'Perfect'
        : emailData.spellErrors?.length <= 5
          ? 'Good'
          : 'Needs Review',
  };

  // Generate QA checklist summary
  const qaChecklistSummary: QAChecklistSummary = {
    totalItems: emailData.qaChecklist?.length || 0,
    completedItems: emailData.qaChecklist?.filter((item) => item.completed).length || 0,
    completionPercentage:
      emailData.qaChecklist?.length > 0
        ? Math.round(
            (emailData.qaChecklist.filter((item) => item.completed).length /
              emailData.qaChecklist.length) *
              100
          )
        : 0,
    status:
      emailData.qaChecklist?.length === 0
        ? 'Not Started'
        : emailData.qaChecklist.filter((item) => item.completed).length /
              emailData.qaChecklist.length ===
            1
          ? 'Complete'
          : emailData.qaChecklist.filter((item) => item.completed).length /
                emailData.qaChecklist.length >=
              0.75
            ? 'Nearly Complete'
            : 'In Progress',
  };

  // Convert screenshots to data URLs
  const emailDesktopDataUrl = emailData.screenshotDesktopUrl
    ? await imageToDataUrl(emailData.screenshotDesktopUrl, userDataPath)
    : '';
  const emailMobileDataUrl = emailData.screenshotMobileUrl
    ? await imageToDataUrl(emailData.screenshotMobileUrl, userDataPath)
    : '';

  // Convert link screenshots to data URLs (use string keys for Handlebars lookup compatibility)
  const linkScreenshots: Record<string, string> = {};
  for (const link of emailData.links) {
    if (link.screenshotPath) {
      linkScreenshots[String(link.id)] = await imageToDataUrl(link.screenshotPath, userDataPath);
    }
  }

  // Convert attachment images to data URLs (use string keys for Handlebars lookup compatibility)
  const attachmentUrls: Record<string, string> = {};
  for (const attachment of emailData.attachments || []) {
    if (attachment.mimeType?.startsWith('image/') && attachment.path) {
      attachmentUrls[String(attachment.id)] = await imageToDataUrl(attachment.path, userDataPath);
    }
  }

  // Transform attachments with pre-computed isImage flag for Handlebars
  const attachments: AttachmentWithIsImage[] = (emailData.attachments || []).map((attachment: any) => ({
    id: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    isImage: attachment.mimeType?.startsWith('image/') ?? false,
  }));

  // Prepare template data
  const templateData: PDFTemplateData = {
    emailData,
    attachments,
    emailPreviewDataUrl: '',
    emailDesktopDataUrl,
    emailMobileDataUrl,
    linkScreenshots,
    attachmentUrls,
    linkStatusSummary,
    imageStatusSummary,
    spellCheckSummary,
    qaChecklistSummary,
    qaNotesCount: emailData.qaNotes?.length || 0,
    generatedAt: new Date().toLocaleString(),
  };

  // Load and render templates
  const reportTemplate = loadTemplate('pdf-report');
  const layoutTemplate = loadTemplate('pdf-layout');

  const reportContent = reportTemplate(templateData);
  const htmlContent = layoutTemplate({
    ...templateData,
    body: reportContent,
  });

  return htmlContent;
}
