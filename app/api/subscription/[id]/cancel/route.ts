import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/monitoring";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  try {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionId = params.id;

    // Verify the subscription belongs to the user
    if (!subscriptionId.startsWith(`sub_${userId}`)) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Update user to free plan (simulate subscription cancellation)
    await db
      .update(users)
      .set({
        plan: "free",
        rewritesLimit: 3,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId));

    logger.info("Subscription cancelled", {
      userId,
      subscriptionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error cancelling subscription", {
      userId: userId || "unknown",
      subscriptionId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
