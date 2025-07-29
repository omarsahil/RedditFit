import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/rewrite-limits";
import { logger } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = await getUserPlan(userId);

    logger.info("User plan fetched", {
      userId,
      plan: userPlan.plan,
      rewritesUsed: userPlan.rewritesUsed,
      rewritesLimit: userPlan.rewritesLimit,
    });

    return NextResponse.json(userPlan);
  } catch (error) {
    logger.error("Error fetching user plan", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });

    return NextResponse.json(
      { error: "Failed to fetch user plan" },
      { status: 500 }
    );
  }
}
