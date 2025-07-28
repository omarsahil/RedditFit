import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/rewrite-limits";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userPlan = await getUserPlan(userId);

    return NextResponse.json(userPlan);
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch user plan" },
      { status: 500 }
    );
  }
}
