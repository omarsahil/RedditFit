import { initializeScheduledJobs } from "./background-jobs";
import { setupGlobalErrorHandling } from "./error-monitoring";
import { logger } from "./monitoring";
import { checkDatabaseHealth } from "./database";

export async function initializeInfrastructure() {
  try {
    logger.info("Initializing technical infrastructure...");

    // Check database health
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.status !== "healthy") {
      logger.warn("Database health check failed", { status: dbHealth.status });
    } else {
      logger.info("Database health check passed");
    }

    // Initialize scheduled jobs
    initializeScheduledJobs();
    logger.info("Scheduled jobs initialized");

    // Setup global error handling
    setupGlobalErrorHandling();
    logger.info("Global error handling setup complete");

    // Log initialization complete
    logger.info("Technical infrastructure initialization complete", {
      database: dbHealth.status,
      scheduledJobs: "initialized",
      errorHandling: "setup",
    });

    return {
      success: true,
      database: dbHealth.status,
      scheduledJobs: "initialized",
      errorHandling: "setup",
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
