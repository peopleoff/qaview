import Handlebars from "handlebars";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Register Handlebars helpers
Handlebars.registerHelper("formatDate", (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
});

Handlebars.registerHelper("getStatusColor", (status: number) => {
  if (status >= 200 && status < 300)
    return "text-green-600";
  if (status >= 400)
    return "text-red-600";
  return "text-muted-foreground";
});

Handlebars.registerHelper("getSpellCheckStatusColor", (status: string) => {
  switch (status) {
    case "Perfect": return "text-green-600";
    case "Good": return "text-yellow-600";
    case "Needs Review": return "text-red-600";
    default: return "text-muted-foreground";
  }
});

Handlebars.registerHelper("getQAChecklistStatusColor", (status: string) => {
  switch (status) {
    case "Complete": return "text-green-600";
    case "Nearly Complete": return "text-yellow-600";
    case "In Progress": return "text-blue-600";
    default: return "text-muted-foreground";
  }
});

Handlebars.registerHelper("add", (a: number, b: number) => a + b);

Handlebars.registerHelper("and", (a: any, b: any) => a && b);

Handlebars.registerHelper("or", (a: any, b: any) => a || b);

Handlebars.registerHelper("ne", (a: any, b: any) => a !== b);

Handlebars.registerHelper("gt", (a: number, b: number) => a > b);

Handlebars.registerHelper("hasUtmParams", (utmParams: any) => {
  return utmParams && Object.keys(utmParams).length > 0;
});

Handlebars.registerHelper("parseSuggestions", (suggestionsJson: string) => {
  try {
    return JSON.parse(suggestionsJson || "[]");
  }
  catch {
    return [];
  }
});

Handlebars.registerHelper("join", (array: string[], separator: string) => {
  return Array.isArray(array) ? array.join(separator) : "";
});

Handlebars.registerHelper("formatFileSize", (bytes: number) => {
  if (bytes === 0)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
});

const compiledTemplates: Record<string, HandlebarsTemplateDelegate> = {};
const compiledPartials: Record<string, HandlebarsTemplateDelegate> = {};

async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  if (compiledTemplates[templateName]) {
    return compiledTemplates[templateName];
  }

  const templatePath = join(process.cwd(), "server/templates", `${templateName}.hbs`);
  const templateSource = await readFile(templatePath, "utf-8");
  compiledTemplates[templateName] = Handlebars.compile(templateSource);

  return compiledTemplates[templateName];
}

async function loadPartial(partialName: string): Promise<void> {
  if (compiledPartials[partialName]) {
    return;
  }

  const partialPath = join(process.cwd(), "server/templates/partials", `${partialName}.hbs`);
  const partialSource = await readFile(partialPath, "utf-8");

  Handlebars.registerPartial(partialName, partialSource);
  compiledPartials[partialName] = Handlebars.compile(partialSource);
}

async function loadLayout(layoutName: string): Promise<HandlebarsTemplateDelegate> {
  const layoutPath = join(process.cwd(), "server/templates/layouts", `${layoutName}.hbs`);
  const layoutSource = await readFile(layoutPath, "utf-8");
  return Handlebars.compile(layoutSource);
}

export async function renderTemplate(
  templateName: string,
  data: any,
  layoutName?: string,
): Promise<string> {
  // Load all partials first
  const partialNames = [
    "header",
    "summary",
    "detailed-links",
    "detailed-images",
    "detailed-spell-check",
    "attachments",
    "qa-checklist",
    "qa-notes",
    "links-summary",
  ];

  await Promise.all(partialNames.map(name => loadPartial(name)));

  // Load and render template
  const template = await loadTemplate(templateName);
  const content = template(data);

  // If layout is specified, wrap content in layout
  if (layoutName) {
    const layout = await loadLayout(layoutName);
    return layout({
      ...data,
      body: content,
    });
  }

  return content;
}
