import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/monitoring";
import { getPlanFromDodoPlanId } from "@/lib/rewrite-limits";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const status = searchParams.get("status");
    const paymentSuccess = searchParams.get("payment_success");
    const userId = searchParams.get("user_id");
    const planId = searchParams.get("plan_id");

    logger.info("Processing simulation payment success", {
      sessionId,
      userId,
      planId,
      status,
      paymentSuccess,
    });

    // Handle simulation mode payment completion
    if (paymentSuccess === "true" && userId && planId) {
      try {
        // Get plan details from Dodo payment plan ID
        const planDetails = getPlanFromDodoPlanId(planId);

        // Update user plan in database
        await db
          .update(users)
          .set({
            plan: planDetails.plan,
            rewritesLimit: planDetails.rewritesLimit,
            rewritesUsed: 0, // Reset usage count
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, userId));

        logger.info("User plan updated after simulation payment", {
          userId,
          planId,
          newPlan: planDetails.plan,
          newLimit: planDetails.rewritesLimit,
        });

        // Redirect to dashboard with success message
        return NextResponse.redirect(
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/dashboard?payment=success&plan=${planDetails.plan}`
        );
      } catch (error) {
        logger.error("Error updating user plan after simulation payment", {
          userId,
          planId,
          error: error instanceof Error ? error.message : String(error),
        });

        // Redirect to dashboard with error message
        return NextResponse.redirect(
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/dashboard?payment=error`
        );
      }
    }

    // If parameters are missing, redirect to pricing page
    logger.warn("Missing parameters in simulation payment", {
      sessionId,
      userId,
      planId,
      paymentSuccess,
    });

    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/pricing?payment=cancelled`
    );
  } catch (error) {
    logger.error("Simulation payment handler error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dashboard?payment=error`
    );
  }
}