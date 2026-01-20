import Handlebars from 'handlebars';

/**
 * Register all Handlebars helper functions for PDF template rendering
 */
export function registerTemplateHelpers() {
  // Format timestamp to readable date
  Handlebars.registerHelper('formatDate', (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  });

  // Get Tailwind color class based on HTTP status code
  Handlebars.registerHelper('getStatusColor', (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400) return 'text-red-600';
    return 'text-muted-foreground';
  });

  // Get color class for spell check status
  Handlebars.registerHelper('getSpellCheckStatusColor', (status: string) => {
    switch (status) {
      case 'Perfect':
        return 'text-green-600';
      case 'Good':
        return 'text-yellow-600';
      case 'Needs Review':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  });

  // Get color class for QA checklist status
  Handlebars.registerHelper('getQAChecklistStatusColor', (status: string) => {
    switch (status) {
      case 'Complete':
        return 'text-green-600';
      case 'Nearly Complete':
        return 'text-yellow-600';
      case 'In Progress':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  });

  // Math and logic helpers
  Handlebars.registerHelper('add', (a: number, b: number) => a + b);
  Handlebars.registerHelper('and', (a: any, b: any) => a && b);
  Handlebars.registerHelper('or', (a: any, b: any) => a || b);
  Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
  Handlebars.registerHelper('gt', (a: number, b: number) => a > b);

  // Check if UTM parameters exist
  Handlebars.registerHelper('hasUtmParams', (utmParams: any) => {
    return utmParams && Object.keys(utmParams).length > 0;
  });

  // Parse JSON suggestions
  Handlebars.registerHelper('parseSuggestions', (suggestionsJson: string) => {
    try {
      return JSON.parse(suggestionsJson || '[]');
    } catch {
      return [];
    }
  });

  // Join array with separator
  Handlebars.registerHelper('join', (array: string[], separator: string) => {
    return Array.isArray(array) ? array.join(separator) : '';
  });

  // Format file size in bytes to human readable
  Handlebars.registerHelper('formatFileSize', (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  });
}
