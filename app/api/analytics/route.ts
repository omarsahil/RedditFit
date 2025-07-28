import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all posts for this user
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));

    if (userPosts.length === 0) {
      return NextResponse.json({
        totalRewrites: 0,
        averageCompliance: 0,
        topSubreddits: [],
        recentTrends: [],
      });
    }

    // Calculate total rewrites
    const totalRewrites = userPosts.length;

    // Calculate average compliance score
    const averageCompliance = Math.round(
      userPosts.reduce((sum, post) => sum + (post.complianceScore || 0), 0) /
        totalRewrites
    );

    // Calculate top subreddits
    const subredditCounts: { [key: string]: number } = {};
    userPosts.forEach((post) => {
      subredditCounts[post.subreddit] =
        (subredditCounts[post.subreddit] || 0) + 1;
    });

    const topSubreddits = Object.entries(subredditCounts)
      .map(([subreddit, count]) => ({ subreddit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate recent trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPosts = userPosts.filter(
      (post) => new Date(post.createdAt) >= thirtyDaysAgo
    );

    const dailyCounts: { [key: string]: number } = {};

    // Initialize all days in the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyCounts[dateStr] = 0;
    }

    // Count posts per day
    recentPosts.forEach((post) => {
      const dateStr = new Date(post.createdAt).toISOString().split("T")[0];
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++;
      }
    });

    const recentTrends = Object.entries(dailyCounts)
      .map(([date, rewrites]) => ({ date, rewrites }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalRewrites,
      averageCompliance,
      topSubreddits,
      recentTrends,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
