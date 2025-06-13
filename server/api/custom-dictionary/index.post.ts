import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const addWordSchema = z.object({
  word: z.string().min(1).max(50).regex(/^[a-z']+$/i, "Word must contain only letters and apostrophes"),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, addWordSchema.parseAsync);

  try {
    const customDicPath = join(process.cwd(), "public/dictionaries/custom.dic");

    // Read current custom dictionary
    let customDicContent = "";
    try {
      customDicContent = await readFile(customDicPath, "utf-8");
    }
    catch {
      // Create new custom dictionary if it doesn't exist
      customDicContent = "0\n";
    }

    const lines = customDicContent.split("\n");
    const words = lines.slice(1).filter(line => line.trim());

    // Check if word already exists (case insensitive)
    const wordLower = body.word.toLowerCase();
    const existingWord = words.find(word => word.toLowerCase() === wordLower);

    if (existingWord) {
      throw createError({
        statusCode: 409,
        statusMessage: "Word already exists in custom dictionary",
      });
    }

    // Add the new word
    words.push(body.word);
    words.sort(); // Keep dictionary sorted for easier management

    // Write updated dictionary
    const newContent = `${words.length}\n${words.join("\n")}\n`;
    await writeFile(customDicPath, newContent, "utf-8");

    return {
      success: true,
      word: body.word,
      totalWords: words.length,
    };
  }
  catch (error) {
    console.error("Failed to add word to custom dictionary:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add word to custom dictionary",
    });
  }
});
