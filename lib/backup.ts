import { db, users, posts } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "./monitoring";

interface BackupData {
  version: string;
  timestamp: string;
  userId: string;
  user: any;
  posts: any[];
  metadata: {
    totalPosts: number;
    totalRewrites: number;
    averageCompliance: number;
  };
}

interface RestoreResult {
  success: boolean;
  message: string;
  restoredItems?: {
    user: boolean;
    posts: number;
  };
}

class BackupManager {
  private readonly version = "1.0.0";

  async createBackup(userId: string): Promise<BackupData> {
    try {
      logger.info("Starting backup creation", { userId });

      // Get user data
      const userData = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

      if (userData.length === 0) {
        throw new Error("User not found");
      }

      // Get user posts
      const userPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, userId));

      // Calculate metadata
      const totalPosts = userPosts.length;
      const totalRewrites = userPosts.length;
      const averageCompliance =
        userPosts.length > 0
          ? Math.round(
              userPosts.reduce(
                (sum, post) => sum + (post.complianceScore || 0),
                0
              ) / totalPosts
            )
          : 0;

      const backupData: BackupData = {
        version: this.version,
        timestamp: new Date().toISOString(),
        userId,
        user: userData[0],
        posts: userPosts,
        metadata: {
          totalPosts,
          totalRewrites,
          averageCompliance,
        },
      };

      logger.info("Backup created successfully", {
        userId,
        totalPosts,
        averageCompliance,
      });

      return backupData;
    } catch (error) {
      logger.error("Backup creation failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async restoreBackup(backupData: BackupData): Promise<RestoreResult> {
    try {
      logger.info("Starting backup restoration", { userId: backupData.userId });

      // Validate backup data
      if (!backupData.version || !backupData.userId || !backupData.user) {
        throw new Error("Invalid backup data format");
      }

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, backupData.userId))
        .limit(1);

      let userRestored = false;
      let postsRestored = 0;

      // Restore user data (update if exists, create if not)
      if (existingUser.length > 0) {
        await db
          .update(users)
          .set({
            plan: backupData.user.plan,
            rewritesUsed: backupData.user.rewritesUsed,
            rewritesLimit: backupData.user.rewritesLimit,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, backupData.userId));
        userRestored = true;
      } else {
        await db.insert(users).values({
          id: backupData.user.id,
          clerkId: backupData.user.clerkId,
          email: backupData.user.email,
          plan: backupData.user.plan,
          rewritesUsed: backupData.user.rewritesUsed,
          rewritesLimit: backupData.user.rewritesLimit,
          createdAt: new Date(backupData.user.createdAt),
          updatedAt: new Date(),
        });
        userRestored = true;
      }

      // Restore posts
      if (backupData.posts && backupData.posts.length > 0) {
        // Delete existing posts for this user
        await db.delete(posts).where(eq(posts.userId, backupData.userId));

        // Insert restored posts
        for (const post of backupData.posts) {
          await db.insert(posts).values({
            id: post.id,
            userId: post.userId,
            originalTitle: post.originalTitle,
            originalBody: post.originalBody,
            rewrittenTitle: post.rewrittenTitle,
            rewrittenBody: post.rewrittenBody,
            subreddit: post.subreddit,
            complianceScore: post.complianceScore,
            changes: post.changes,
            createdAt: new Date(post.createdAt),
          });
          postsRestored++;
        }
      }

      logger.info("Backup restoration completed", {
        userId: backupData.userId,
        userRestored,
        postsRestored,
      });

      return {
        success: true,
        message: `Successfully restored ${postsRestored} posts and user data`,
        restoredItems: {
          user: userRestored,
          posts: postsRestored,
        },
      };
    } catch (error) {
      logger.error("Backup restoration failed", {
        userId: backupData.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async exportBackup(userId: string): Promise<string> {
    const backupData = await this.createBackup(userId);
    return JSON.stringify(backupData, null, 2);
  }

  async importBackup(backupJson: string): Promise<RestoreResult> {
    try {
      const backupData: BackupData = JSON.parse(backupJson);
      return await this.restoreBackup(backupData);
    } catch (error) {
      logger.error("Backup import failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Invalid backup file format");
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      logger.info("Deleting user data", { userId });

      // Delete user posts
      await db.delete(posts).where(eq(posts.userId, userId));

      // Delete user
      await db.delete(users).where(eq(users.clerkId, userId));

      logger.info("User data deleted successfully", { userId });
    } catch (error) {
      logger.error("User data deletion failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getBackupInfo(userId: string): Promise<{
    lastBackup?: string;
    totalPosts: number;
    totalRewrites: number;
    averageCompliance: number;
  }> {
    try {
      const userPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.userId, userId));

      const totalPosts = userPosts.length;
      const totalRewrites = userPosts.length;
      const averageCompliance =
        userPosts.length > 0
          ? Math.round(
              userPosts.reduce(
                (sum, post) => sum + (post.complianceScore || 0),
                0
              ) / totalPosts
            )
          : 0;

      const lastBackup =
        userPosts.length > 0
          ? new Date(
              Math.max(...userPosts.map((p) => new Date(p.createdAt).getTime()))
            ).toISOString()
          : undefined;

      return {
        lastBackup,
        totalPosts,
        totalRewrites,
        averageCompliance,
      };
    } catch (error) {
      logger.error("Failed to get backup info", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const backupManager = new BackupManager();

// API route handlers
export async function handleBackupExport(userId: string) {
  try {
    const backupJson = await backupManager.exportBackup(userId);
    return {
      success: true,
      data: backupJson,
      filename: `reddifit-backup-${userId}-${
        new Date().toISOString().split("T")[0]
      }.json`,
    };
  } catch (error) {
    logger.error("Backup export failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function handleBackupImport(userId: string, backupJson: string) {
  try {
    const result = await backupManager.importBackup(backupJson);
    return result;
  } catch (error) {
    logger.error("Backup import failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function handleDataDeletion(userId: string) {
  try {
    await backupManager.deleteUserData(userId);
    return {
      success: true,
      message: "All user data has been deleted successfully",
    };
  } catch (error) {
    logger.error("Data deletion failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
