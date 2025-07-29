import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getUserPlan } from "@/lib/rewrite-limits";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    const status = {
      timestamp: new Date().toISOString(),
      authenticated: !!userId,
      userId: userId || null,
      database: {
        connected: false,
        error: null as string | null,
      },
      userPlan: {
        available: false,
        error: null as string | null,
        data: null as any,
      },
      history: {
        available: false,
        error: null as string | null,
        count: 0,
      },
      analytics: {
        available: false,
        error: null as string | null,
      },
    };

    // Test database connection
    try {
      await db.select().from(users).limit(1);
      status.database.connected = true;
    } catch (dbError) {
      status.database.error = dbError instanceof Error ? dbError.message : String(dbError);
    }

    // Test user plan if authenticated
    if (userId) {
      try {
        const userPlan = await getUserPlan(userId);
        status.userPlan.available = true;
        status.userPlan.data = userPlan;
      } catch (planError) {
        status.userPlan.error = planError instanceof Error ? planError.message : String(planError);
      }

      // Test history if database is connected
      if (status.database.connected) {
        try {
          const userPosts = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1);
          status.history.available = true;
          status.history.count = userPosts.length;
        } catch (historyError) {
          status.history.error = historyError instanceof Error ? historyError.message : String(historyError);
        }
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check dashboard status",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 