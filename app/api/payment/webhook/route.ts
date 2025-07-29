import { NextRequest, NextResponse } from "next/server";
import { createDodoPaymentClient } from "@/lib/dodopayment";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/monitoring";
import { getPlanFromDodoPlanId } from "@/lib/rewrite-limits";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("dodo-signature");

    if (!signature) {
      logger.error("Missing DodoPayment signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const dodoPayment = createDodoPaymentClient();
    const event = dodoPayment.verifyWebhookSignature(payload, signature);

    logger.info("Received webhook event", {
      type: event.type,
      eventId: event.id,
    });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data);
        break;
      case "payment.processing":
        await handlePaymentProcessing(event.data);
        break;
      case "payment.succeeded":
        await handlePaymentSuccess(event.data);
        break;
      case "payment.failed":
        await handlePaymentFailure(event.data);
        break;
      case "payment.cancelled":
        await handlePaymentCancelled(event.data);
        break;
      case "subscription.active":
        await handleSubscriptionActive(event.data);
        break;
      case "subscription.renewed":
        await handleSubscriptionRenewed(event.data);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.data);
        break;
      case "subscription.expired":
        await handleSubscriptionExpired(event.data);
        break;
      case "subscription.failed":
        await handleSubscriptionFailed(event.data);
        break;
      case "subscription.plan_changed":
        await handleSubscriptionPlanChanged(event.data);
        break;
      default:
        logger.info("Unhandled webhook event type", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(data: any) {
  const { metadata } = data;
  const userId = metadata?.userId;
  const planId = metadata?.planId;

  if (!userId || !planId) {
    logger.error("Missing user or plan data in checkout session completion", {
      data,
    });
    return;
  }

  try {
    // Get plan details from Dodo payment plan ID
    const planDetails = getPlanFromDodoPlanId(planId);

    // Update user plan in database
    await db
      .update(users)
      .set({
        plan: planDetails.plan,
        rewritesLimit: planDetails.rewritesLimit,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId));

    logger.info("User plan updated after successful checkout", {
      userId,
      planId,
      newPlan: planDetails.plan,
      newLimit: planDetails.rewritesLimit,
    });
  } catch (error) {
    logger.error("Error updating user plan after checkout completion", {
      userId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handlePaymentSuccess(data: any) {
  const { metadata } = data;
  const userId = metadata?.userId;
  const planId = metadata?.planId;

  if (!userId || !planId) {
    logger.error("Missing user or plan data in payment success", { data });
    return;
  }

  try {
    // Get plan details from Dodo payment plan ID
    const planDetails = getPlanFromDodoPlanId(planId);

    // Update user plan in database
    await db
      .update(users)
      .set({
        plan: planDetails.plan,
        rewritesLimit: planDetails.rewritesLimit,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId));

    logger.info("User plan updated after successful payment", {
      userId,
      planId,
      newPlan: planDetails.plan,
      newLimit: planDetails.rewritesLimit,
    });
  } catch (error) {
    logger.error("Error updating user plan after payment success", {
      userId,
      planId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handlePaymentFailure(data: any) {
  const { metadata } = data;
  const userId = metadata?.userId;
  const planId = metadata?.planId;

  logger.info("Payment failed", {
    userId,
    planId,
    failureReason: data.last_payment_error?.message,
  });
}

async function handleSubscriptionPayment(data: any) {
  const { customer, subscription } = data;

  logger.info("Subscription payment succeeded", {
    customerId: customer,
    subscriptionId: subscription,
  });
}

async function handleSubscriptionCancelled(data: any) {
  const { customer } = data;

  try {
    // Downgrade user to free plan
    await db
      .update(users)
      .set({
        plan: "free",
        rewritesLimit: 3,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, customer));

    logger.info(
      "User downgraded to free plan after subscription cancellation",
      {
        userId: customer,
      }
    );
  } catch (error) {
    logger.error("Error downgrading user after subscription cancellation", {
      userId: customer,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handlePaymentProcessing(data: any) {
  const { metadata } = data;
  const userId = metadata?.userId;
  const planId = metadata?.planId;

  logger.info("Payment processing", {
    userId,
    planId,
    paymentId: data.id,
  });
}

async function handlePaymentCancelled(data: any) {
  const { metadata } = data;
  const userId = metadata?.userId;
  const planId = metadata?.planId;

  logger.info("Payment cancelled", {
    userId,
    planId,
    paymentId: data.id,
  });
}

async function handleSubscriptionActive(data: any) {
  const { customer, plan } = data;

  try {
    // Get plan details from Dodo payment plan ID
    const planDetails = getPlanFromDodoPlanId(plan);

    await db
      .update(users)
      .set({
        plan: planDetails.plan,
        rewritesLimit: planDetails.rewritesLimit,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, customer));

    logger.info("User subscription activated", {
      userId: customer,
      planId: plan,
      newPlan: planDetails.plan,
      newLimit: planDetails.rewritesLimit,
    });
  } catch (error) {
    logger.error("Error activating subscription", {
      userId: customer,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleSubscriptionRenewed(data: any) {
  const { customer } = data;

  logger.info("Subscription renewed", {
    userId: customer,
    subscriptionId: data.id,
  });
}

async function handleSubscriptionExpired(data: any) {
  const { customer } = data;

  try {
    // Downgrade user to free plan
    await db
      .update(users)
      .set({
        plan: "free",
        rewritesLimit: 3,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, customer));

    logger.info("User downgraded to free plan after subscription expiration", {
      userId: customer,
    });
  } catch (error) {
    logger.error("Error downgrading user after subscription expiration", {
      userId: customer,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleSubscriptionFailed(data: any) {
  const { customer } = data;

  logger.info("Subscription payment failed", {
    userId: customer,
    subscriptionId: data.id,
  });
}

async function handleSubscriptionPlanChanged(data: any) {
  const { customer, plan } = data;

  try {
    // Get plan details from Dodo payment plan ID
    const planDetails = getPlanFromDodoPlanId(plan);

    await db
      .update(users)
      .set({
        rewritesLimit: planDetails.rewritesLimit,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, customer));

    logger.info("User plan changed", {
      userId: customer,
      planId: plan,
      newLimit: planDetails.rewritesLimit,
    });
  } catch (error) {
    logger.error("Error changing user plan", {
      userId: customer,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
