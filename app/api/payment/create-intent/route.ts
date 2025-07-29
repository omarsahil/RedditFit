import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createDodoPaymentClient } from "@/lib/dodopayment";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Validate plan ID
    const dodoPayment = createDodoPaymentClient();
    const availablePlans = dodoPayment.getAvailablePlans();
    const selectedPlan = availablePlans.find((plan) => plan.id === planId);

    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
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

    // Check if user is already on the selected plan
    if (userData.plan === "pro" && planId === "pro-monthly") {
      return NextResponse.json(
        { error: "You are already subscribed to this plan" },
        { status: 400 }
      );
    }

    // Create checkout session with Dodo payment
    const checkoutSession = await dodoPayment.createCheckoutSession({
      planId,
      userId,
      email: userData.email,
      successUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dashboard?payment=success`,
      cancelUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/pricing?payment=cancelled`,
      metadata: {
        currentPlan: userData.plan,
        currentRewritesLimit: userData.rewritesLimit,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
      },
    });

    logger.info("Created checkout session", {
      userId,
      planId,
      checkoutSessionId: checkoutSession.id,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    logger.error("Error creating checkout session", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      planId,
    });

    // Return more specific error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: errorMessage,
        planId,
        userId,
      },
      { status: 500 }
    );
  }
}
