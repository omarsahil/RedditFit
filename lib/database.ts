import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Database connection configuration
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Serverless connection for Neon
const sql = neon(DATABASE_URL);

// Database instance - using serverless connection for better Next.js compatibility
export const db = drizzle(sql as any);

// Database tables with optimized indexes
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    plan: text("plan").notNull().default("free"),
    rewritesUsed: integer("rewrites_used").notNull().default(0),
    rewritesLimit: integer("rewrites_limit").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clerkIdIdx: uniqueIndex("clerk_id_idx").on(table.clerkId),
    emailIdx: index("email_idx").on(table.email),
    planIdx: index("plan_idx").on(table.plan),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    originalTitle: text("original_title").notNull(),
    originalBody: text("original_body"),
    rewrittenTitle: text("rewritten_title").notNull(),
    rewrittenBody: text("rewritten_body"),
    subreddit: text("subreddit").notNull(),
    complianceScore: integer("compliance_score"),
    changes: text("changes"), // JSON string
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    subredditIdx: index("subreddit_idx").on(table.subreddit),
    createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
    complianceScoreIdx: index("compliance_score_idx").on(table.complianceScore),
    userSubredditIdx: index("user_subreddit_idx").on(
      table.userId,
      table.subreddit
    ),
  })
);

export const subredditRules = pgTable(
  "subreddit_rules",
  {
    id: text("id").primaryKey(),
    subreddit: text("subreddit").notNull().unique(),
    rules: text("rules").notNull(), // JSON string
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => ({
    subredditIdx: uniqueIndex("subreddit_rules_idx").on(table.subreddit),
    lastUpdatedIdx: index("rules_last_updated_idx").on(table.lastUpdated),
  })
);

// Database health check
export async function checkDatabaseHealth() {
  try {
    const result = await sql`SELECT 1 as health_check`;
    return {
      status: "healthy",
      result: result[0],
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Database migration helper
export async function runMigration(migration: string) {
  try {
    await sql(migration);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Performance monitoring
export class DatabaseMonitor {
  private queryTimes: Map<string, number[]> = new Map();
  private slowQueryThreshold = 1000; // 1 second

  recordQuery(query: string, duration: number) {
    if (!this.queryTimes.has(query)) {
      this.queryTimes.set(query, []);
    }
    this.queryTimes.get(query)!.push(duration);

    // Keep only last 100 queries per query type
    if (this.queryTimes.get(query)!.length > 100) {
      this.queryTimes.set(query, this.queryTimes.get(query)!.slice(-100));
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected: ${query} took ${duration}ms`);
    }
  }

  getQueryStats() {
    const stats: Record<string, any> = {};

    for (const [query, times] of Array.from(this.queryTimes.entries())) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      stats[query] = {
        count: times.length,
        average: Math.round(avg),
        max,
        min,
        slowQueries: times.filter((t) => t > this.slowQueryThreshold).length,
      };
    }

    return stats;
  }

  reset() {
    this.queryTimes.clear();
  }
}

export const dbMonitor = new DatabaseMonitor();

// Connection pool monitoring (not applicable for serverless connections)
export function getPoolStats() {
  return {
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  };
}

// Graceful shutdown (not applicable for serverless connections)
export async function closeDatabaseConnections() {
  // No-op for serverless connections
  return Promise.resolve();
}
