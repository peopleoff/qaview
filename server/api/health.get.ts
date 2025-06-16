import db from "@/lib/db/index";

export default defineEventHandler(async () => {
  try {
    // Simple database connectivity check
    await db.query.emails.findFirst({
      columns: { id: true },
    });

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    };
  }
  catch (error) {
    console.error(error);
    throw createError({
      statusCode: 503,
      statusMessage: "Service Unavailable - Database connection failed",
    });
  }
});
