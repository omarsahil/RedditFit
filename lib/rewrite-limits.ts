import { db, users } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface UserPlan {
  plan: "free" | "pro";
  rewritesUsed: number;
  rewritesLimit: number;
  canRewrite: boolean;
  resetDate: Date;
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  try {
    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (user.length === 0) {
      // Create new user with free plan
      const newUser = {
        id: uuidv4(),
        clerkId: userId,
        email: "", // Will be updated when user signs up
        plan: "free",
        rewritesUsed: 0,
        rewritesLimit: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(users).values(newUser);

      return {
        plan: "free",
        rewritesUsed: 0,
        rewritesLimit: 3,
        canRewrite: true,
        resetDate: getNextResetDate(),
      };
    }

    const userData = user[0];

    // Check if we need to reset daily limits (for free users)
    const resetDate = getNextResetDate();
    const lastReset = userData.updatedAt;

    // If it's a new day, reset the counter for free users
    if (userData.plan === "free" && isNewDay(lastReset)) {
      await db
        .update(users)
        .set({
          rewritesUsed: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId));

      return {
        plan: userData.plan as "free" | "pro",
        rewritesUsed: 0,
        rewritesLimit: userData.rewritesLimit,
        canRewrite: true,
        resetDate,
      };
    }

    // Determine if user can rewrite based on their plan
    const canRewrite =
      userData.plan === "pro" || userData.rewritesUsed < userData.rewritesLimit;

    return {
      plan: userData.plan as "free" | "pro",
      rewritesUsed: userData.rewritesUsed,
      rewritesLimit: userData.rewritesLimit,
      canRewrite,
      resetDate,
    };
  } catch (error) {
    console.error("Error getting user plan:", error);
    // Fallback to free plan
    return {
      plan: "free",
      rewritesUsed: 0,
      rewritesLimit: 3,
      canRewrite: true,
      resetDate: getNextResetDate(),
    };
  }
}

export async function incrementRewriteCount(userId: string): Promise<void> {
  try {
    // First get the current user to get their current rewrite count
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (user.length > 0) {
      const currentCount = user[0].rewritesUsed || 0;

      await db
        .update(users)
        .set({
          rewritesUsed: currentCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, userId));
    }
  } catch (error) {
    console.error("Error incrementing rewrite count:", error);
  }
}

function getNextResetDate(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

function isNewDay(lastUpdate: Date): boolean {
  const now = new Date();
  const last = new Date(lastUpdate);

  return (
    now.getFullYear() !== last.getFullYear() ||
    now.getMonth() !== last.getMonth() ||
    now.getDate() !== last.getDate()
  );
}

export function getPlanLimits(plan: string): {
  rewritesLimit: number;
  features: string[];
} {
  switch (plan) {
    case "free":
      return {
        rewritesLimit: 3,
        features: [
          "3 free rewrites per day",
          "Basic AI optimization",
          "Subreddit rules analysis",
          "Compliance scoring",
          "Rewrite history",
        ],
      };
    case "pro":
      return {
        rewritesLimit: -1, // Unlimited
        features: [
          "Unlimited rewrites",
          "Advanced AI models",
          "Bulk rewrite mode",
          "Custom AI tones",
          "Priority processing",
          "Advanced analytics",
          "Advanced reporting",
          "Priority support",
        ],
      };
    default:
      return {
        rewritesLimit: 3,
        features: [
          "3 free rewrites per day",
          "Basic AI optimization",
          "Subreddit rules analysis",
          "Compliance scoring",
          "Rewrite history",
        ],
      };
  }
}

// Helper function to get plan details from Dodo payment plans
export function getPlanFromDodoPlanId(planId: string): {
  plan: "free" | "pro";
  rewritesLimit: number;
} {
  switch (planId) {
    case "basic-monthly":
      return {
        plan: "pro",
        rewritesLimit: 50,
      };
    case "pro-monthly":
      return {
        plan: "pro",
        rewritesLimit: -1, // Unlimited
      };
    case "unlimited-monthly":
      return {
        plan: "pro",
        rewritesLimit: -1, // Unlimited
      };
    default:
      return {
        plan: "free",
        rewritesLimit: 3,
      };
  }
}
