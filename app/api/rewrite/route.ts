import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedSubredditRules } from "@/lib/reddit";
import { db, posts } from "@/lib/db";
import { getUserPlan, incrementRewriteCount } from "@/lib/rewrite-limits";
import { v4 as uuidv4 } from "uuid";
import { createErrorResponse } from "@/lib/error-handler";
import { rateLimiters, getRateLimitHeaders } from "@/lib/rate-limiter";
import { caches, cacheUtils } from "@/lib/cache";
import { logger } from "@/lib/monitoring";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-4o";

function buildPrompt({
  title,
  body,
  subreddit,
  rules,
  aiTone,
  creativity,
}: {
  title: string;
  body: string;
  subreddit: string;
  rules: any;
  aiTone: string;
  creativity: number;
}) {
  const toneInstructions = {
    professional:
      "Use a professional, business-like tone with clear structure and formal language.",
    casual: "Use a casual, relaxed tone that feels natural and conversational.",
    friendly: "Use a warm, approachable tone that builds rapport with readers.",
    humorous:
      "Use a light, witty tone with appropriate humor while staying relevant.",
    formal:
      "Use a very formal, academic tone with precise language and structure.",
    conversational:
      "Use a natural, conversational tone that feels like talking to a friend.",
  };

  return `You are an expert Reddit moderator and writer. Your job is to rewrite Reddit posts to maximize compliance with subreddit rules and engagement, while preserving the user's intent.

Subreddit: r/${subreddit}
Rules: ${
    rules.rules?.map((r: any) => `- ${r.title}: ${r.description}`).join("\n") ||
    "N/A"
  }

Original Title: ${title}
Original Body: ${body || "[empty]"}

Tone Instructions: ${
    toneInstructions[aiTone as keyof typeof toneInstructions] ||
    toneInstructions.professional
  }

Creativity Level: ${creativity} (0=very conservative, 1=very creative)

Instructions:
- Rewrite the title and body to maximize compliance and engagement.
- Always preserve and rewrite the body for compliance; do not remove the body.
- Use the specified tone and creativity level.
- Return ONLY a valid JSON object with keys: rewrittenTitle, rewrittenBody, complianceScore (0-100), and changes (array of strings describing what you changed).
- Do not include any explanation or text outside the JSON.
- Be concise and clear.

Example:
Input:
  Title: Why do cats purr
  Body: 
  Subreddit: explainlikeimfive
Output:
  {
    "rewrittenTitle": "ELI5: Why do cats purr?",
    "rewrittenBody": "[your improved body here]",
    "complianceScore": 95,
    "changes": ["Added ELI5 prefix", "Formatted as a question"]
  }

Now process the user's post:`;
}

function extractJSON(text: string) {
  // Try to extract the first JSON object from the text
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function rewriteWithLLM({
  title,
  body,
  subreddit,
  rules,
  aiTone,
  aiModel,
  creativity,
}: {
  title: string;
  body: string;
  subreddit: string;
  rules: any;
  aiTone: string;
  aiModel: string;
  creativity: number;
}) {
  const prompt = buildPrompt({
    title,
    body,
    subreddit,
    rules,
    aiTone,
    creativity,
  });

  console.log("LLM Prompt:", prompt);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://reddifit.com",
        "X-Title": "ReddiFit - AI Post Rewriter",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: creativity,
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", response.status, errorText);
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  console.log("LLM Response:", content);

  if (!content) {
    throw new Error("No content in LLM response");
  }

  const jsonResult = extractJSON(content);
  if (!jsonResult) {
    console.error("Could not extract JSON from response:", content);
    throw new Error("Could not extract JSON from LLM response");
  }

  // Validate the required fields
  if (
    !jsonResult.rewrittenTitle ||
    !jsonResult.complianceScore ||
    !jsonResult.changes
  ) {
    console.error("Invalid JSON structure:", jsonResult);
    throw new Error("Invalid JSON structure in LLM response");
  }

  return jsonResult;
}

export async function POST(request: NextRequest) {
  const { userId } = auth();
  try {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = rateLimiters.rewrite.isAllowed(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getRateLimitHeaders(rateLimit),
          },
        }
      );
    }

    // Check user's rewrite limits
    const userPlan = await getUserPlan(userId);
    if (!userPlan.canRewrite) {
      return NextResponse.json(
        {
          error: "Daily rewrite limit reached",
          details: `You have used ${userPlan.rewritesUsed} of ${userPlan.rewritesLimit} rewrites today. Upgrade to Pro for unlimited rewrites and advanced features.`,
          userPlan,
        },
        { status: 429 }
      );
    }

    const {
      title,
      body,
      subreddit,
      aiTone = "professional",
      aiModel = "gpt-4o",
      creativity = 0.3,
    } = await request.json();
    if (!title || !subreddit) {
      return NextResponse.json(
        { error: "Title and subreddit are required" },
        { status: 400 }
      );
    }

    console.log("Processing rewrite request:", {
      title,
      subreddit,
      aiTone,
      aiModel,
      creativity,
    });

    // Fetch subreddit rules (cached)
    let rules;
    try {
      const cacheKey = cacheUtils.subredditRulesKey(subreddit);
      const cachedRules = caches.subredditRules.get(cacheKey);

      if (cachedRules) {
        rules = cachedRules;
        logger.info("Using cached subreddit rules", { subreddit });
      } else {
        rules = await getCachedSubredditRules(subreddit);
        caches.subredditRules.set(cacheKey, rules);
        logger.info("Fetched and cached rules for subreddit", { subreddit });
      }
    } catch (e) {
      logger.warn("Failed to fetch rules for subreddit", {
        subreddit,
        error: e instanceof Error ? e.message : String(e),
      });
      rules = { rules: [] };
    }

    // Rewrite using LLM with AI controls
    logger.info("Calling LLM for rewrite", { userId, subreddit, aiModel });
    const optimization = await rewriteWithLLM({
      title,
      body,
      subreddit,
      rules,
      aiTone,
      aiModel,
      creativity,
    });
    logger.info("LLM rewrite completed", {
      userId,
      subreddit,
      complianceScore: optimization.complianceScore,
    });

    // Validate the response
    if (
      !optimization.rewrittenTitle ||
      !optimization.complianceScore ||
      !optimization.changes
    ) {
      throw new Error("Invalid LLM response - missing required fields");
    }

    // Ensure rewrittenBody exists
    if (!optimization.rewrittenBody) {
      optimization.rewrittenBody = body || "";
    }

    // Save to database directly
    try {
      const newPost = {
        id: uuidv4(),
        userId,
        originalTitle: title,
        originalBody: body || "",
        rewrittenTitle: optimization.rewrittenTitle,
        rewrittenBody: optimization.rewrittenBody,
        subreddit,
        complianceScore: optimization.complianceScore,
        changes: JSON.stringify(optimization.changes),
        createdAt: new Date(),
      };

      await db.insert(posts).values(newPost);
      logger.info("Saved rewrite to database", { postId: newPost.id, userId });

      // Increment rewrite count for the user
      await incrementRewriteCount(userId);
      logger.info("Incremented rewrite count for user", { userId });
    } catch (e) {
      logger.error("Failed to save to database", { userId, error: e instanceof Error ? e.message : String(e) });
      // Don't fail the entire request if database save fails
    }

    return NextResponse.json(optimization);
  } catch (error) {
    logger.error("Rewrite API error", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get("subreddit");
  if (!subreddit) {
    return NextResponse.json(
      { error: "Subreddit is required" },
      { status: 400 }
    );
  }
  try {
    const rules = await getCachedSubredditRules(subreddit);
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch rules",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
