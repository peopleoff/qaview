import { eq } from "drizzle-orm";

import db from "@/lib/db/index";
import { emails, links } from "@/lib/db/schema/index";
import { routeParamsSchema } from "~/lib/validations";

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, routeParamsSchema.parseAsync);
  
  // Check if email exists
  const email = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  if (!email[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found",
    });
  }

  // Get all links for this email
  const emailLinks = await db.select().from(links).where(eq(links.emailId, id));

  // Extract utm_campaign values
  const utmCampaigns = emailLinks
    .map(link => {
      // utmParams is already parsed as JSON by Drizzle due to mode: "json"
      const utmParams = link.utmParams || {};
      return utmParams.utm_campaign;
    })
    .filter(campaign => campaign && campaign.trim() !== ""); // Remove null/empty values

  const uniqueCampaigns = [...new Set(utmCampaigns)];

  return {
    emailId: email[0].emailId,
    availableCampaigns: uniqueCampaigns,
    hasMultipleCampaigns: uniqueCampaigns.length > 1,
    hasNoCampaigns: uniqueCampaigns.length === 0,
  };
});