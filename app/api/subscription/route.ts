import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createDodoPaymentClient } from "@/lib/dodopayment";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];

    // If user is on free plan, return no subscription
    if (userData.plan === "free") {
      return NextResponse.json({ subscription: null });
    }

    // In a real implementation, you would fetch the actual subscription from DodoPayment
    // For now, we'll return a mock subscription based on the user's plan
    const dodoPayment = createDodoPaymentClient();
    const plans = dodoPayment.getAvailablePlans();
    const plan = plans.find((p) => p.rewritesLimit === userData.rewritesLimit);

    if (!plan) {
      return NextResponse.json({ subscription: null });
    }

    // Mock subscription data
    const subscription = {
      id: `sub_${userId}`,
      status: "active",
      planId: plan.id,
      planName: plan.name,
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days from now
      cancelAtPeriodEnd: false,
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    logger.error("Error fetching subscription", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
