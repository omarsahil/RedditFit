import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, posts } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// GET /api/rewrite/history - fetch all rewrites for the authenticated user
export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Fetch all posts for this user, sorted by createdAt desc
  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
  return NextResponse.json(userPosts);
}

// POST /api/rewrite/history - save a new rewrite for the authenticated user
export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const {
    originalTitle,
    originalBody,
    rewrittenTitle,
    rewrittenBody,
    subreddit,
    complianceScore,
    changes,
  } = await request.json();
  const newPost = {
    id: uuidv4(),
    userId,
    originalTitle,
    originalBody,
    rewrittenTitle,
    rewrittenBody,
    subreddit,
    complianceScore,
    changes: JSON.stringify(changes),
    createdAt: new Date(),
  };
  await db.insert(posts).values(newPost);
  return NextResponse.json({ success: true, post: newPost });
}

// DELETE /api/rewrite/history?id=... - delete a post by id for the authenticated user
export async function DELETE(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));
  return NextResponse.json({ success: true });
}

// PATCH /api/rewrite/history - edit a post for the authenticated user
export async function PATCH(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, rewrittenTitle, rewrittenBody, complianceScore, changes } =
    await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await db
    .update(posts)
    .set({
      rewrittenTitle,
      rewrittenBody,
      complianceScore,
      changes: JSON.stringify(changes),
    })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));
  return NextResponse.json({ success: true });
}
