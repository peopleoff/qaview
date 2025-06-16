import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Typo from "typo-js";

export type SpellingError = {
  word: string;
  position: number;
  suggestions: string[];
  context: string;
};

export type SpellCheckResult = {
  errors: SpellingError[];
  totalWords: number;
  misspelledWords: number;
};

let dictionary: Typo | null = null;

/**
 * Initialize the spell checker with Hunspell dictionaries
 */
async function initializeDictionary(): Promise<Typo> {
  if (dictionary) {
    return dictionary;
  }

  try {
    // Load main dictionary files
    const dicPath = join(process.cwd(), "public/dictionaries/en_US.dic");
    const affPath = join(process.cwd(), "public/dictionaries/en_US.aff");
    const customDicPath = join(process.cwd(), "public/dictionaries/custom.dic");

    const dicFile = await readFile(dicPath, "utf-8");
    const affFile = await readFile(affPath, "utf-8");

    // Load custom dictionary if it exists
    let customDicFile = "";
    try {
      customDicFile = await readFile(customDicPath, "utf-8");
    }
    catch {
      // Custom dictionary is optional
    }

    // Merge dictionaries if custom dictionary exists
    let mergedDicFile = dicFile;
    if (customDicFile.trim()) {
      const customWords = customDicFile.split("\n").slice(1); // Skip first line (count)
      const mainWords = dicFile.split("\n");
      const totalWords = mainWords.length + customWords.length - 1;

      // Update word count and append custom words
      mergedDicFile = `${totalWords}\n${mainWords.slice(1).join("\n")}\n${customWords.join("\n")}`;
    }

    // Initialize Typo.js with the merged dictionary data
    dictionary = new Typo("en_US", affFile, mergedDicFile);

    return dictionary;
  }
  catch (error) {
    console.error("Failed to initialize spell checker dictionary:", error);
    throw new Error("Spell checker initialization failed");
  }
}

/**
 * Extract text content from HTML while preserving some structure
 */
function extractTextFromHtml(html: string): string {
  // Basic HTML tag removal while preserving spaces
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
    .replace(/<[^>]*>/g, " ") // Replace tags with spaces
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&[a-z0-9]+;/gi, " ") // Replace other HTML entities
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Extract words from text and their positions
 */
function extractWords(text: string): Array<{ word: string; position: number }> {
  const words: Array<{ word: string; position: number }> = [];
  const wordRegex = /\b[a-z][a-z']*\b/gi;
  let match = wordRegex.exec(text);

  while (match !== null) {
    words.push({
      word: match[0],
      position: match.index,
    });
    match = wordRegex.exec(text);
  }

  return words;
}

/**
 * Get context around a misspelled word
 */
function getWordContext(text: string, position: number, word: string): string {
  const contextRadius = 30; // characters before and after
  const start = Math.max(0, position - contextRadius);
  const end = Math.min(text.length, position + word.length + contextRadius);

  let context = text.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0)
    context = `...${context}`;
  if (end < text.length)
    context = `${context}...`;

  return context.trim();
}

/**
 * Check spelling in email HTML content
 */
export async function checkSpelling(html: string): Promise<SpellCheckResult> {
  try {
    // Initialize dictionary if not already loaded
    const dict = await initializeDictionary();

    // Extract text content from HTML
    const textContent = extractTextFromHtml(html);

    if (!textContent.trim()) {
      return {
        errors: [],
        totalWords: 0,
        misspelledWords: 0,
      };
    }

    // Extract words and their positions
    const words = extractWords(textContent);
    const errors: SpellingError[] = [];

    // Check each word
    for (const { word, position } of words) {
      // Skip very short words, numbers, and all caps (likely acronyms)
      if (word.length <= 2 || /^\d+$/.test(word) || word === word.toUpperCase()) {
        continue;
      }

      // Check if word is correctly spelled
      const isCorrect = dict.check(word);

      if (!isCorrect) {
        // Get suggestions for misspelled word
        const suggestions = dict.suggest(word);

        // Get context around the word
        const context = getWordContext(textContent, position, word);

        errors.push({
          word,
          position,
          suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
          context,
        });
      }
    }

    return {
      errors,
      totalWords: words.length,
      misspelledWords: errors.length,
    };
  }
  catch (error) {
    console.error("Spell check failed:", error);
    return {
      errors: [],
      totalWords: 0,
      misspelledWords: 0,
    };
  }
}

/**
 * Get spell check statistics
 */
export function getSpellCheckStats(result: SpellCheckResult): {
  accuracy: number;
  errorRate: number;
} {
  if (result.totalWords === 0) {
    return { accuracy: 100, errorRate: 0 };
  }

  const accuracy = ((result.totalWords - result.misspelledWords) / result.totalWords) * 100;
  const errorRate = (result.misspelledWords / result.totalWords) * 100;

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}
