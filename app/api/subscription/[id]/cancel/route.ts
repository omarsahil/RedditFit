import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createDodoPaymentClient } from "@/lib/dodopayment";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/monitoring";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
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

    const dodoPayment = createDodoPaymentClient();

    // In a real implementation, you would cancel the subscription with DodoPayment
    // For now, we'll simulate the cancellation by updating the user's plan
    try {
      // Cancel subscription with DodoPayment
      await dodoPayment.cancelSubscription(subscriptionId);

      // Update user to free plan
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
        userId,
        subscriptionId,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in cancel subscription route", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
