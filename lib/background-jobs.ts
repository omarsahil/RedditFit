import { db, posts, users } from "./database";
import { eq, and, gte, desc } from "drizzle-orm";
import { logger } from "./monitoring";
import { dbMonitor } from "./database";

interface Job {
  id: string;
  type: string;
  data: any;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

interface JobQueue {
  [key: string]: Job[];
}

class BackgroundJobProcessor {
  private queue: JobQueue = {};
  private isProcessing = false;
  private maxConcurrentJobs = 3;
  private activeJobs = 0;

  // Add job to queue
  async addJob(type: string, data: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const job: Job = {
      id: jobId,
      type,
      data,
      status: "pending",
      createdAt: new Date(),
    };

    if (!this.queue[type]) {
      this.queue[type] = [];
    }
    this.queue[type].push(job);

    logger.info("Job added to queue", { jobId, type, data });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processJobs();
    }

    return jobId;
  }

  // Process jobs in queue
  private async processJobs() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.activeJobs < this.maxConcurrentJobs) {
      const nextJob = this.getNextJob();
      if (!nextJob) break;

      this.activeJobs++;
      this.processJob(nextJob).finally(() => {
        this.activeJobs--;
      });
    }

    this.isProcessing = false;
  }

  // Get next job from queue
  private getNextJob(): Job | null {
    for (const [type, jobs] of Object.entries(this.queue)) {
      const pendingJob = jobs.find((job) => job.status === "pending");
      if (pendingJob) {
        return pendingJob;
      }
    }
    return null;
  }

  // Process individual job
  private async processJob(job: Job) {
    const startTime = Date.now();

    try {
      job.status = "processing";
      job.startedAt = new Date();

      logger.info("Processing job", { jobId: job.id, type: job.type });

      let result;
      switch (job.type) {
        case "bulk_rewrite":
          result = await this.processBulkRewrite(job.data);
          break;
        case "data_cleanup":
          result = await this.processDataCleanup(job.data);
          break;
        case "analytics_update":
          result = await this.processAnalyticsUpdate(job.data);
          break;
        case "user_migration":
          result = await this.processUserMigration(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = "completed";
      job.completedAt = new Date();
      job.result = result;

      const duration = Date.now() - startTime;
      logger.info("Job completed", {
        jobId: job.id,
        type: job.type,
        duration,
        result,
      });
    } catch (error) {
      job.status = "failed";
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : "Unknown error";

      const duration = Date.now() - startTime;
      logger.error("Job failed", {
        jobId: job.id,
        type: job.type,
        duration,
        error: job.error,
      });
    }
  }

  // Bulk rewrite processing
  private async processBulkRewrite(data: { userId: string; posts: any[] }) {
    const { userId, posts: postsToProcess } = data;
    const results = [];

    for (const post of postsToProcess) {
      try {
        // Process each post (simplified - would integrate with your rewrite logic)
        const processedPost = {
          ...post,
          processedAt: new Date(),
          status: "completed",
        };

        results.push(processedPost);

        // Add delay to prevent overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          ...post,
          processedAt: new Date(),
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      totalProcessed: postsToProcess.length,
      successful: results.filter((r) => r.status === "completed").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    };
  }

  // Data cleanup processing
  private async processDataCleanup(data: { olderThan: Date }) {
    const startTime = Date.now();

    // Clean up old posts
    const deletedPosts = await db
      .delete(posts)
      .where(gte(posts.createdAt, data.olderThan));

    // Clean up old user data
    const deletedUsers = await db
      .delete(users)
      .where(gte(users.createdAt, data.olderThan));

    const duration = Date.now() - startTime;
    dbMonitor.recordQuery("data_cleanup", duration);

    return {
      deletedPosts: deletedPosts.rowCount || 0,
      deletedUsers: deletedUsers.rowCount || 0,
      duration,
    };
  }

  // Analytics update processing
  private async processAnalyticsUpdate(data: { userId?: string }) {
    const startTime = Date.now();

    if (data.userId) {
      // Update analytics for specific user
      const userPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, data.userId))
        .orderBy(desc(posts.createdAt));

      const analytics = {
        totalPosts: userPosts.length,
        averageCompliance:
          userPosts.length > 0
            ? Math.round(
                userPosts.reduce(
                  (sum, post) => sum + (post.complianceScore || 0),
                  0
                ) / userPosts.length
              )
            : 0,
        topSubreddits: this.getTopSubreddits(userPosts),
      };

      const duration = Date.now() - startTime;
      dbMonitor.recordQuery("analytics_update", duration);

      return analytics;
    } else {
      // Update global analytics
      const allPosts = await db.select().from(posts);

      const globalAnalytics = {
        totalPosts: allPosts.length,
        totalUsers: await db
          .select()
          .from(users)
          .then((users) => users.length),
        averageCompliance:
          allPosts.length > 0
            ? Math.round(
                allPosts.reduce(
                  (sum, post) => sum + (post.complianceScore || 0),
                  0
                ) / allPosts.length
              )
            : 0,
      };

      const duration = Date.now() - startTime;
      dbMonitor.recordQuery("global_analytics_update", duration);

      return globalAnalytics;
    }
  }

  // User migration processing
  private async processUserMigration(data: {
    fromPlan: string;
    toPlan: string;
  }) {
    const startTime = Date.now();

    const migratedUsers = await db
      .update(users)
      .set({
        plan: data.toPlan,
        updatedAt: new Date(),
      })
      .where(eq(users.plan, data.fromPlan));

    const duration = Date.now() - startTime;
    dbMonitor.recordQuery("user_migration", duration);

    return {
      migratedUsers: migratedUsers.rowCount || 0,
      fromPlan: data.fromPlan,
      toPlan: data.toPlan,
      duration,
    };
  }

  // Helper method to get top subreddits
  private getTopSubreddits(posts: any[]) {
    const subredditCounts: Record<string, number> = {};

    posts.forEach((post) => {
      subredditCounts[post.subreddit] =
        (subredditCounts[post.subreddit] || 0) + 1;
    });

    return Object.entries(subredditCounts)
      .map(([subreddit, count]) => ({ subreddit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Get job status
  getJobStatus(jobId: string): Job | null {
    for (const jobs of Object.values(this.queue)) {
      const job = jobs.find((j) => j.id === jobId);
      if (job) return job;
    }
    return null;
  }

  // Get queue status
  getQueueStatus() {
    const status: Record<string, any> = {};

    for (const [type, jobs] of Object.entries(this.queue)) {
      status[type] = {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === "pending").length,
        processing: jobs.filter((j) => j.status === "processing").length,
        completed: jobs.filter((j) => j.status === "completed").length,
        failed: jobs.filter((j) => j.status === "failed").length,
      };
    }

    return {
      queueStatus: status,
      activeJobs: this.activeJobs,
      maxConcurrentJobs: this.maxConcurrentJobs,
    };
  }

  // Clear completed jobs
  clearCompletedJobs() {
    for (const [type, jobs] of Object.entries(this.queue)) {
      this.queue[type] = jobs.filter((job) => job.status !== "completed");
    }
  }
}

export const jobProcessor = new BackgroundJobProcessor();

// Scheduled job runner
export class ScheduledJobRunner {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Schedule a job to run periodically
  scheduleJob(name: string, intervalMs: number, jobType: string, data: any) {
    if (this.intervals.has(name)) {
      this.intervals.get(name)?.unref();
    }

    const interval = setInterval(async () => {
      try {
        await jobProcessor.addJob(jobType, data);
        logger.info("Scheduled job executed", { name, jobType });
      } catch (error) {
        logger.error("Scheduled job failed", { name, jobType, error });
      }
    }, intervalMs);

    this.intervals.set(name, interval);
    logger.info("Scheduled job created", { name, intervalMs, jobType });
  }

  // Stop a scheduled job
  stopJob(name: string) {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
      logger.info("Scheduled job stopped", { name });
    }
  }

  // Stop all scheduled jobs
  stopAllJobs() {
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    logger.info("All scheduled jobs stopped");
  }

  // Get scheduled jobs status
  getScheduledJobsStatus() {
    return Array.from(this.intervals.keys());
  }
}

export const scheduledJobs = new ScheduledJobRunner();

// Initialize default scheduled jobs
export function initializeScheduledJobs() {
  // Daily data cleanup (remove posts older than 30 days)
  scheduledJobs.scheduleJob(
    "daily_cleanup",
    24 * 60 * 60 * 1000, // 24 hours
    "data_cleanup",
    { olderThan: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  );

  // Hourly analytics update
  scheduledJobs.scheduleJob(
    "hourly_analytics",
    60 * 60 * 1000, // 1 hour
    "analytics_update",
    {}
  );

  logger.info("Scheduled jobs initialized");
}
