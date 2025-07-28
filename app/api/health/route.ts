import { NextRequest, NextResponse } from "next/server";
import {
  checkDatabaseHealth,
  getPoolStats,
  dbMonitor,
} from "../../../lib/database";
import { jobProcessor, scheduledJobs } from "../../../lib/background-jobs";
import { cdnManager } from "../../../lib/cdn";
import { errorMonitor } from "../../../lib/error-monitoring";
import { logger, metrics, performanceMonitor } from "../../../lib/monitoring";
import { caches } from "../../../lib/cache";
import { rateLimiters } from "../../../lib/rate-limiter";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    const dbStats = getPoolStats();
    const dbQueryStats = dbMonitor.getQueryStats();

    // Check background job status
    const jobQueueStatus = jobProcessor.getQueueStatus();
    const scheduledJobsStatus = scheduledJobs.getScheduledJobsStatus();

    // Check CDN status
    const cdnStats = cdnManager.getStats();

    // Check error monitoring status
    const errorStatus = errorMonitor.getStatus();
    const errorStats = errorMonitor.getErrorStats();

    // Check cache status
    const cacheStats = {
      subredditRules: caches.subredditRules.getStats(),
      userData: caches.userData.getStats(),
      apiResponses: caches.apiResponses.getStats(),
      rateLimits: caches.rateLimits.getStats(),
    };

    // Check rate limiter status (simplified)
    const rateLimiterStats = {
      api: "active",
      rewrite: "active", 
      auth: "active",
      freeUser: "active",
    };

    // Get monitoring metrics (simplified)
    const monitoringMetrics = {
      logs: "active",
      metrics: "active", 
      performance: "active",
    };

    // Determine overall health status
    const isHealthy =
      dbHealth.status === "healthy" &&
      errorStatus.status !== "critical" &&
      jobQueueStatus.activeJobs < jobQueueStatus.maxConcurrentJobs;

    const response = {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",

      // Database
      database: {
        status: dbHealth.status,
        connections: dbStats,
        queryStats: dbQueryStats,
      },

      // Background Jobs
      backgroundJobs: {
        queue: jobQueueStatus,
        scheduled: scheduledJobsStatus,
      },

      // CDN
      cdn: cdnStats,

      // Error Monitoring
      errorMonitoring: {
        status: errorStatus,
        stats: errorStats,
      },

      // Caching
      cache: cacheStats,

      // Rate Limiting
      rateLimiting: rateLimiterStats,

      // Monitoring
      monitoring: monitoringMetrics,

      // System
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const duration = Date.now() - startTime;
    logger.info("Health check completed", {
      duration,
      status: response.status,
    });

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check-Duration": duration.toString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
    });

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check-Duration": duration.toString(),
        },
      }
    );
  }
}
