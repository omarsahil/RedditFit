"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Plus,
  Trash2,
  Info,
  HelpCircle,
  Lock,
} from "lucide-react";

interface PostRewriterProps {
  onRewriteComplete?: () => void;
}

export function PostRewriter({ onRewriteComplete }: PostRewriterProps) {
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [subreddit, setSubreddit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [result, setResult] = useState<{
    rewrittenTitle: string;
    rewrittenBody: string;
    complianceScore: number;
    changes: string[];
  } | null>(null);

  // Bulk rewrite state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkPosts, setBulkPosts] = useState<
    Array<{
      id: string;
      title: string;
      body: string;
      subreddit: string;
    }>
  >([{ id: "1", title: "", body: "", subreddit: "" }]);
  const [bulkResults, setBulkResults] = useState<
    Array<{
      id: string;
      originalTitle: string;
      originalBody: string;
      subreddit: string;
      result: any;
      loading: boolean;
      error: string;
    }>
  >([]);

  // Subreddit rules state
  const [rules, setRules] = useState<any>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState("");

  // Advanced AI Controls
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [aiTone, setAiTone] = useState("professional");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [creativity, setCreativity] = useState(0.3);

  // Rule highlighting state
  const [ruleAnalysis, setRuleAnalysis] = useState<{
    followedRules: string[];
    violatedRules: string[];
    tips: string[];
  } | null>(null);

  // User plan state
  const [userPlan, setUserPlan] = useState<{
    plan: string;
    rewritesUsed: number;
    rewritesLimit: number;
    canRewrite: boolean;
    resetDate: Date;
  } | null>(null);

  useEffect(() => {
    if (!subreddit.trim()) {
      setRules(null);
      setRulesError("");
      return;
    }

    // Add a small delay to prevent rapid API calls
    const timeoutId = setTimeout(() => {
      setRulesLoading(true);
      setRulesError("");
      fetch(`/api/rewrite?subreddit=${encodeURIComponent(subreddit)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch rules");
          return res.json();
        })
        .then((data) => {
          setRules(data);
          setRulesLoading(false);
        })
        .catch((err) => {
          setRules(null);
          setRulesError("Could not load rules for this subreddit.");
          setRulesLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [subreddit]);

  // Fetch user plan on component mount
  useEffect(() => {
    fetch("/api/user/plan")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch user plan");
        return res.json();
      })
      .then((data) => {
        setUserPlan(data);
      })
      .catch((err) => {
        console.error("Failed to fetch user plan:", err);
      });
  }, []);

  const handleRewrite = async () => {
    if (!postTitle.trim() || !subreddit.trim()) return;

    setIsLoading(true);
    setRuleAnalysis(null);

    try {
      console.log("Sending rewrite request:", {
        title: postTitle,
        subreddit,
        aiTone,
        aiModel,
        creativity,
      });

      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: postTitle,
          body: postBody,
          subreddit: subreddit,
          aiTone,
          aiModel,
          creativity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);

        // Handle limit reached error
        if (response.status === 429) {
          // Refresh user plan to get updated counts
          fetch("/api/user/plan")
            .then(async (res) => {
              if (res.ok) {
                const planData = await res.json();
                setUserPlan(planData);
              }
            })
            .catch((err) => {
              console.error("Failed to refresh user plan:", err);
            });
        }

        throw new Error(
          errorData.error ||
            errorData.details ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Rewrite result:", result);

      if (!result.rewrittenTitle) {
        throw new Error("Invalid response from API - missing rewritten title");
      }

      setResult(result);

      // Analyze rules compliance
      if (rules && rules.rules) {
        const analysis = analyzeRuleCompliance(
          postTitle,
          postBody,
          rules.rules
        );
        setRuleAnalysis(analysis);
      }

      // Refresh user plan to update rewrite count
      fetch("/api/user/plan")
        .then(async (res) => {
          if (res.ok) {
            const planData = await res.json();
            setUserPlan(planData);
          }
        })
        .catch((err) => {
          console.error("Failed to refresh user plan:", err);
        });

      // Notify parent component to refresh header
      if (onRewriteComplete) {
        console.log("Calling onRewriteComplete callback");
        onRewriteComplete();
      }
    } catch (error) {
      console.error("Error rewriting post:", error);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Show error in the UI instead of alert
      setResult({
        rewrittenTitle: `[Error: ${errorMessage}] ${postTitle}`,
        rewrittenBody: postBody
          ? `${postBody}\n\n[Rewrite failed: ${errorMessage}]`
          : `[Rewrite failed: ${errorMessage}]`,
        complianceScore: 0,
        changes: [`Error: ${errorMessage}`],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRewrite = async () => {
    if (bulkPosts.length === 0) return;

    // Initialize results
    const initialResults = bulkPosts.map((post) => ({
      id: post.id,
      originalTitle: post.title,
      originalBody: post.body,
      subreddit: post.subreddit,
      result: null,
      loading: true,
      error: "",
    }));
    setBulkResults(initialResults);

    // Process each post
    for (let i = 0; i < bulkPosts.length; i++) {
      const post = bulkPosts[i];
      if (!post.title.trim() || !post.subreddit.trim()) {
        setBulkResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  loading: false,
                  error: "Title and subreddit are required",
                }
              : r
          )
        );
        continue;
      }

      try {
        const response = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: post.title,
            body: post.body,
            subreddit: post.subreddit,
            aiTone,
            aiModel,
            creativity,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to rewrite post");
        }

        const result = await response.json();
        setBulkResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, result, loading: false } : r
          )
        );
      } catch (error) {
        setBulkResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, loading: false, error: "Failed to rewrite" } : r
          )
        );
      }
    }
  };

  const addBulkPost = () => {
    const newId = (bulkPosts.length + 1).toString();
    setBulkPosts((prev) => [
      ...prev,
      { id: newId, title: "", body: "", subreddit: "" },
    ]);
  };

  const removeBulkPost = (id: string) => {
    if (bulkPosts.length > 1) {
      setBulkPosts((prev) => prev.filter((post) => post.id !== id));
      setBulkResults((prev) => prev.filter((result) => result.id !== id));
    }
  };

  const updateBulkPost = (
    id: string,
    field: "title" | "body" | "subreddit",
    value: string
  ) => {
    setBulkPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, [field]: value } : post))
    );
  };

  const copyAllBulkResults = () => {
    const allText = bulkResults
      .filter((r) => r.result)
      .map(
        (r) =>
          `Original: ${r.originalTitle}\nRewritten: ${r.result.rewrittenTitle}\n\n${r.result.rewrittenBody}\n\n---\n`
      )
      .join("\n");

    copyToClipboard(allText, "All rewrites");
  };

  // Analyze rule compliance
  const analyzeRuleCompliance = (title: string, body: string, rules: any[]) => {
    const followedRules: string[] = [];
    const violatedRules: string[] = [];
    const tips: string[] = [];

    const content = `${title} ${body}`.toLowerCase();

    // Quick analysis
    if (
      content.includes("buy") ||
      content.includes("sale") ||
      content.includes("promote")
    ) {
      violatedRules.push("No Spam");
      tips.push("Remove promotional language");
    } else {
      followedRules.push("No Spam");
    }

    if (
      content.includes("stupid") ||
      content.includes("idiot") ||
      content.includes("hate")
    ) {
      violatedRules.push("Be Respectful");
      tips.push("Use respectful language");
    } else {
      followedRules.push("Be Respectful");
    }

    if (title.length < 15) {
      violatedRules.push("Descriptive Title");
      tips.push("Make title longer");
    } else {
      followedRules.push("Descriptive Title");
    }

    followedRules.push("On Topic");
    followedRules.push("Reddit Rules");

    return { followedRules, violatedRules, tips };
  };

  const copyToClipboard = async (text: string, type: string = "content") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // General Reddit rules fallback
  const GENERAL_RULES = [
    {
      title: "Be Respectful",
      description: "Be respectful and civil to other users",
    },
    {
      title: "Stay On Topic",
      description: "Keep posts relevant to the subreddit's purpose",
    },
    {
      title: "No Spam",
      description: "No spam, self-promotion, or advertising",
    },
    {
      title: "Follow Reddit Rules",
      description: "Follow Reddit's content policy and site-wide rules",
    },
    {
      title: "Use Descriptive Titles",
      description: "Use clear, descriptive titles for your posts",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[4fr,3fr] gap-6 items-start relative z-10">
      {/* Left: Form and Results */}
      <div className="space-y-6 h-full">
        {/* Mode Toggle */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Rewrite Your Reddit Post
              </h2>
              <p className="text-gray-600">
                Optimize your posts for better engagement and compliance
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsBulkMode(false)}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  !isBulkMode
                    ? "bg-reddit text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Single Post
              </button>
              {userPlan && userPlan.plan === "pro" ? (
                <button
                  onClick={() => setIsBulkMode(true)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                    isBulkMode
                      ? "bg-reddit text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bulk Rewrite
                </button>
              ) : (
                <Link href="/pricing">
                  <button
                    className="px-4 py-2 rounded text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer flex items-center"
                    title="Upgrade to Pro to use bulk rewrite"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Bulk Rewrite
                  </button>
                </Link>
              )}
            </div>
          </div>

          {!isBulkMode || (userPlan && userPlan.plan !== "pro") ? (
            /* Single Post Form */
            <div className="space-y-4">
              {/* Subreddit Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Target Subreddit *
                </label>
                <input
                  type="text"
                  value={subreddit}
                  onChange={(e) =>
                    setSubreddit(e.target.value.replace("r/", ""))
                  }
                  placeholder="e.g., AskReddit, programming, funny"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent transition-colors"
                />
                <div className="flex items-center text-xs text-gray-600">
                  <Info className="w-4 h-4 mr-2 text-blue-500" />
                  Don't include "r/" - just the subreddit name
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Post Title *
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g., How do I learn programming as a beginner?"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent transition-colors"
                />
                <div className="flex items-center text-xs text-gray-600">
                  <HelpCircle className="w-4 h-4 mr-2 text-blue-500" />
                  Write a clear, descriptive title that captures attention
                </div>
              </div>

              {/* Body Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Post Body (optional)
                </label>
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Add more context to your post here. This helps the AI understand your intent better and create more relevant rewrites."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent transition-colors resize-vertical"
                />
                <div className="flex items-center text-xs text-gray-600">
                  <Info className="w-4 h-4 mr-2 text-blue-500" />
                  Providing more context helps create better rewrites
                </div>
              </div>

              {/* Advanced AI Controls */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  className="flex items-center text-sm font-semibold text-gray-800 hover:text-reddit transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced AI Controls
                  <span
                    className={`ml-2 transform transition-transform ${
                      showAdvancedControls ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {showAdvancedControls && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Writing Tone
                      </label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent"
                      >
                        <option value="professional">
                          Professional - Formal and business-like
                        </option>
                        <option value="casual">
                          Casual - Relaxed and informal
                        </option>
                        <option value="friendly">
                          Friendly - Warm and approachable
                        </option>
                        <option value="humorous">
                          Humorous - Light and witty
                        </option>
                        <option value="formal">
                          Formal - Academic and precise
                        </option>
                        <option value="conversational">
                          Conversational - Natural and chatty
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        AI Model
                      </label>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent"
                      >
                        <option value="gpt-4o">
                          GPT-4o - Best quality and accuracy
                        </option>
                        <option value="gpt-4o-mini">
                          GPT-4o Mini - Faster processing
                        </option>
                        <option value="claude-3-5-sonnet">
                          Claude 3.5 Sonnet - Balanced performance
                        </option>
                        <option value="gemini-pro">
                          Gemini Pro - Alternative AI model
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800">
                        Creativity Level: {creativity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={creativity}
                        onChange={(e) =>
                          setCreativity(parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Conservative</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRewrite}
                disabled={
                  !postTitle.trim() ||
                  !subreddit.trim() ||
                  isLoading ||
                  rulesLoading ||
                  (userPlan ? userPlan.canRewrite === false : false)
                }
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center py-3 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rewriting Your Post...
                  </>
                ) : userPlan && !userPlan.canRewrite ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Daily Limit Reached
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Rewrite Post
                  </>
                )}
              </button>
            </div>
          ) : userPlan && userPlan.plan !== "pro" ? (
            /* Upgrade Message for Free Users */
            <div className="space-y-4">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">
                    Upgrade to Pro for Bulk Rewrite
                  </h3>
                </div>
                <p className="text-blue-700 mb-4">
                  Bulk rewrite mode allows you to rewrite multiple posts at
                  once, saving you time and effort.
                </p>
                <Link
                  href="/pricing"
                  className="btn-primary inline-flex items-center"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          ) : (
            /* Bulk Rewrite Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Bulk Rewrite Mode
                    {userPlan && userPlan.plan === "pro" && (
                      <span className="ml-2 text-xs bg-reddit text-white px-2 py-1 rounded-full">
                        Pro
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Rewrite multiple posts at once for efficiency
                  </p>
                </div>
                <button
                  onClick={addBulkPost}
                  className="btn-secondary text-sm py-2 px-3 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Post
                </button>
              </div>

              {bulkPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="p-4 border border-gray-200 rounded bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-800">
                      Post {index + 1}
                    </h4>
                    {bulkPosts.length > 1 && (
                      <button
                        onClick={() => removeBulkPost(post.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800">
                        Subreddit *
                      </label>
                      <input
                        type="text"
                        value={post.subreddit}
                        onChange={(e) =>
                          updateBulkPost(
                            post.id,
                            "subreddit",
                            e.target.value.replace("r/", "")
                          )
                        }
                        placeholder="e.g., AskReddit, programming, funny"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) =>
                          updateBulkPost(post.id, "title", e.target.value)
                        }
                        placeholder="Enter your post title..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800">
                        Body (optional)
                      </label>
                      <textarea
                        value={post.body}
                        onChange={(e) =>
                          updateBulkPost(post.id, "body", e.target.value)
                        }
                        placeholder="Add post body content..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-reddit focus:border-transparent transition-colors resize-vertical"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleBulkRewrite}
                disabled={
                  bulkPosts.length === 0 ||
                  bulkPosts.some((p) => !p.title.trim() || !p.subreddit.trim())
                }
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center py-3 text-base font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                Rewrite All Posts ({bulkPosts.length})
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {!isBulkMode && result && (
          <div className="space-y-6">
            {/* Rule Analysis */}
            {ruleAnalysis && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Rule Compliance Analysis
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Followed Rules */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Rules Followed ({ruleAnalysis.followedRules.length})
                    </h4>
                    {ruleAnalysis.followedRules.length > 0 ? (
                      <ul className="space-y-0.5">
                        {ruleAnalysis.followedRules.map((rule, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-green-700 flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-600">
                        No specific rules detected as followed
                      </p>
                    )}
                  </div>

                  {/* Violated Rules */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Potential Issues ({ruleAnalysis.violatedRules.length})
                    </h4>
                    {ruleAnalysis.violatedRules.length > 0 ? (
                      <ul className="space-y-0.5">
                        {ruleAnalysis.violatedRules.map((rule, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-red-700 flex items-center"
                          >
                            <AlertCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-600">
                        No rule violations detected!
                      </p>
                    )}
                  </div>
                </div>

                {/* Compliance Tips */}
                {ruleAnalysis.tips.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                      Compliance Tips
                    </h4>
                    <ul className="space-y-0.5">
                      {ruleAnalysis.tips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-blue-700 flex items-start"
                        >
                          <span className="text-blue-500 mr-2 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Compliance Score */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Compliance Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      result.complianceScore >= 90
                        ? "bg-green-500"
                        : result.complianceScore >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-2xl font-bold text-gray-900">
                    {result.complianceScore}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-800">
                  Changes Made:
                </h4>
                <ul className="space-y-2">
                  {result.changes.map((change, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-gray-700"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rewritten Content */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Rewritten Post
                </h3>
                <div className="flex items-center space-x-2">
                  {copySuccess && (
                    <span className="text-sm text-green-600 font-medium">
                      {copySuccess}
                    </span>
                  )}
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${result.rewrittenTitle}\n\n${result.rewrittenBody}`,
                        "Post"
                      )
                    }
                    className="btn-secondary text-sm py-2 px-3 flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-semibold text-gray-800">
                      Title
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(result.rewrittenTitle, "Title")
                      }
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-base font-medium text-gray-900">
                      {result.rewrittenTitle}
                    </p>
                  </div>
                </div>

                {result.rewrittenBody && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-base font-semibold text-gray-800">
                        Body
                      </label>
                      <button
                        onClick={() =>
                          copyToClipboard(result.rewrittenBody, "Body")
                        }
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {result.rewrittenBody}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Info */}
            {userPlan && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">
                      {userPlan.plan === "free"
                        ? "Free Plan Limits"
                        : `${
                            userPlan.plan.charAt(0).toUpperCase() +
                            userPlan.plan.slice(1)
                          } Plan`}
                    </h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {userPlan.plan === "free"
                        ? userPlan.canRewrite
                          ? `You have ${
                              userPlan.rewritesLimit - userPlan.rewritesUsed
                            } rewrites remaining today. Upgrade to Pro for unlimited rewrites and advanced features.`
                          : `You've used all ${userPlan.rewritesLimit} daily rewrites. Upgrade to Pro for unlimited rewrites and advanced features.`
                        : "You have unlimited rewrites with your current plan."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Results */}
        {isBulkMode && bulkResults.length > 0 && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Bulk Rewrite Results
                </h3>
                <button
                  onClick={copyAllBulkResults}
                  className="btn-secondary text-sm py-2 px-3 flex items-center"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy All
                </button>
              </div>

              <div className="space-y-4">
                {bulkResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="p-4 border border-gray-200 rounded"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-800">
                        Post {index + 1}: r/{result.subreddit}
                      </h4>
                      {result.loading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </div>

                    {result.error ? (
                      <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded">
                        {result.error}
                      </div>
                    ) : result.result ? (
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-semibold text-gray-800">
                              Original Title
                            </label>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              Compliance: {result.result.complianceScore}%
                            </span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded border text-sm">
                            {result.originalTitle}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-semibold text-gray-800">
                              Rewritten Title
                            </label>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  result.result.rewrittenTitle,
                                  "Title"
                                )
                              }
                              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </button>
                          </div>
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-medium text-gray-900">
                              {result.result.rewrittenTitle}
                            </p>
                          </div>
                        </div>

                        {result.result.rewrittenBody && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-sm font-semibold text-gray-800">
                                Rewritten Body
                              </label>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    result.result.rewrittenBody,
                                    "Body"
                                  )
                                }
                                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </button>
                            </div>
                            <div className="p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                {result.result.rewrittenBody}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Subreddit Rules */}
      <div className="h-full">
        <div className="card bg-white border border-gray-200 shadow-sm sticky top-8 h-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Subreddit Rules
          </h3>
          {rulesLoading ? (
            <div className="flex items-center text-gray-600 text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading rules...
            </div>
          ) : rulesError ? (
            <>
              <div className="text-red-600 text-sm mb-4 p-4 bg-red-50 border border-red-200 rounded leading-relaxed">
                {rulesError}
              </div>
              <div className="text-gray-700 text-sm mb-4 leading-relaxed">
                Showing general Reddit rules instead:
              </div>
              <ul className="list-disc pl-6 space-y-3 text-sm text-gray-700">
                {GENERAL_RULES.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed pr-2">
                    <span className="font-semibold">{rule.title}:</span>{" "}
                    {rule.description}
                  </li>
                ))}
              </ul>
            </>
          ) : rules && rules.rules && rules.rules.length > 0 ? (
            <ul className="list-disc pl-6 space-y-3 text-sm text-gray-700">
              {rules.rules.map((rule: any, idx: number) => (
                <li key={idx} className="leading-relaxed pr-2">
                  <span className="font-semibold">{rule.title}:</span>{" "}
                  {rule.description}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div className="text-yellow-700 text-sm mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded leading-relaxed">
                This subreddit has not set up any public rules. Showing general
                Reddit rules:
              </div>
              <ul className="list-disc pl-6 space-y-3 text-sm text-gray-700">
                {GENERAL_RULES.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed pr-2">
                    <span className="font-semibold">{rule.title}:</span>{" "}
                    {rule.description}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
