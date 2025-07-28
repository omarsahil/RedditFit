import { initializeScheduledJobs } from "./background-jobs";
import { setupGlobalErrorHandling } from "./error-monitoring";
import { logger } from "./monitoring";
import { checkDatabaseHealth } from "./database";

export async function initializeInfrastructure() {
  try {
    logger.info("Initializing technical infrastructure...");

    // Check database health (only in production)
    let dbHealth: any = null;
    if (process.env.NODE_ENV === "production") {
      dbHealth = await checkDatabaseHealth();
      if (dbHealth.status !== "healthy") {
        logger.warn("Database health check failed", {
          status: dbHealth.status,
        });
      } else {
        logger.info("Database health check passed");
      }
    } else {
      logger.info("Skipping database health check in development");
    }

    // Initialize scheduled jobs (only in production)
    if (process.env.NODE_ENV === "production") {
      initializeScheduledJobs();
      logger.info("Scheduled jobs initialized");
    } else {
      logger.info("Skipping scheduled jobs initialization in development");
    }

    // Setup global error handling (only in production)
    if (process.env.NODE_ENV === "production") {
      setupGlobalErrorHandling();
      logger.info("Global error handling setup complete");
    } else {
      logger.info("Skipping error handling setup in development");
    }

    // Log initialization complete
    logger.info("Technical infrastructure initialization complete", {
      database:
        process.env.NODE_ENV === "production"
          ? dbHealth?.status
          : "development",
      scheduledJobs:
        process.env.NODE_ENV === "production" ? "initialized" : "skipped",
      errorHandling:
        process.env.NODE_ENV === "production" ? "setup" : "skipped",
    });

    return {
      success: true,
      database:
        process.env.NODE_ENV === "production"
          ? dbHealth?.status
          : "development",
      scheduledJobs:
        process.env.NODE_ENV === "production" ? "initialized" : "skipped",
      errorHandling:
        process.env.NODE_ENV === "production" ? "setup" : "skipped",
    };
  } catch (error) {
    logger.error("Failed to initialize infrastructure", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Auto-initialize when this module is imported
if (typeof window === "undefined") {
  // Only run on server side
  initializeInfrastructure().catch((error) => {
    logger.error("Infrastructure initialization failed", { error });
  });
}
