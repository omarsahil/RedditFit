"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PostRewriter } from "@/components/PostRewriter";
import { Copy, ChevronDown, ChevronRight, Check } from "lucide-react";

export default function DashboardClient() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // User rewrite history state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    totalRewrites: number;
    averageCompliance: number;
    topSubreddits: { subreddit: string; count: number }[];
    recentTrends: { date: string; rewrites: number }[];
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // User plan state
  const [userPlan, setUserPlan] = useState<{
    plan: string;
    rewritesUsed: number;
    rewritesLimit: number;
    canRewrite: boolean;
    resetDate: Date;
  } | null>(null);

  // Fetch user rewrite history
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setLoadingHistory(true);
    setHistoryError("");
    fetch("/api/rewrite/history")
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${res.status}: ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        setHistory(data);
        setLoadingHistory(false);
      })
      .catch((err) => {
        console.error("History fetch error:", err);
        setHistoryError(`Could not load rewrite history: ${err.message}`);
        setLoadingHistory(false);
      });
  }, [isLoaded, isSignedIn]);

  // Fetch analytics
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setLoadingAnalytics(true);
    fetch("/api/analytics")
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${res.status}: ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setLoadingAnalytics(false);
      })
      .catch((err) => {
        console.error("Analytics error:", err);
        setLoadingAnalytics(false);
      });
  }, [isLoaded, isSignedIn]);

  // Fetch user plan
  const fetchUserPlan = useCallback(() => {
    if (!isLoaded || !isSignedIn) return;
    console.log("Fetching user plan...");
    fetch("/api/user/plan")
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${res.status}: ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        console.log("User plan data received:", data);
        setUserPlan(data);
      })
      .catch((err) => {
        console.error("Failed to fetch user plan:", err);
        // Don't set userPlan to null, keep the previous state
      });
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    fetchUserPlan();
  }, [isLoaded, isSignedIn]);

  // Delete a rewrite
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rewrite?")) return;
    await fetch(`/api/rewrite/history?id=${id}`, { method: "DELETE" });
    setHistory((h) => h.filter((item) => item.id !== id));
  };

  // Toggle row expansion
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Run diagnostic
  const runDiagnostic = async () => {
    try {
      const response = await fetch("/api/dashboard/status");
      const data = await response.json();
      setDiagnosticInfo(data);
      setShowDiagnostic(true);
    } catch (error) {
      console.error("Diagnostic failed:", error);
      setDiagnosticInfo({ error: "Failed to run diagnostic" });
      setShowDiagnostic(true);
    }
  };

  // TODO: Add edit functionality (modal or inline)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-reddit mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-reddit rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RedditFit</span>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {userPlan
                  ? userPlan.plan === "free"
                    ? userPlan.canRewrite
                      ? `${
                          userPlan.rewritesLimit - userPlan.rewritesUsed
                        } rewrites remaining`
                      : "0 rewrites remaining"
                    : "∞ unlimited rewrites"
                  : "Loading..."}
              </div>

              {/* Upgrade Button - Show when user has reached limit */}
              {userPlan && userPlan.plan === "free" && !userPlan.canRewrite && (
                <Link
                  href="/pricing"
                  className="bg-reddit text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
                >
                  Upgrade to Pro
                </Link>
              )}

              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            RedditFit Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered Reddit post optimization
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 relative">
          {/* Diagnostic Button */}
          <div className="flex justify-end">
            <button
              onClick={runDiagnostic}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Run Diagnostic
            </button>
          </div>

          {/* Diagnostic Modal */}
          {showDiagnostic && diagnosticInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Dashboard Diagnostic
                  </h3>
                  <button
                    onClick={() => setShowDiagnostic(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                  {JSON.stringify(diagnosticInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Post Rewriter */}
          <div className="relative z-10">
            <PostRewriter onRewriteComplete={fetchUserPlan} />
          </div>
        </div>

        {/* User Rewrite History */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Rewrite History
          </h2>
          {loadingHistory ? (
            <div className="text-gray-500">Loading history...</div>
          ) : historyError ? (
            <div className="text-red-500">{historyError}</div>
          ) : history.length === 0 ? (
            <div className="text-gray-600">No rewrites yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Original Title
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Rewritten Title
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Subreddit
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Compliance
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <>
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 max-w-xs">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="mr-2 text-gray-400 hover:text-gray-600"
                            >
                              {expandedRows.has(item.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <span
                              className="truncate"
                              title={item.originalTitle}
                            >
                              {item.originalTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 max-w-xs">
                          <div className="flex items-center justify-between">
                            <span
                              className="truncate"
                              title={item.rewrittenTitle}
                            >
                              {item.rewrittenTitle}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  item.rewrittenTitle,
                                  "Rewritten title"
                                )
                              }
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copy rewritten title"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">r/{item.subreddit}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.complianceScore >= 90
                                ? "bg-green-100 text-green-800"
                                : item.complianceScore >= 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.complianceScore}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(item.id) && (
                        <tr key={`${item.id}-expanded`} className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Original Content
                                </h4>
                                <div className="bg-white border rounded-lg p-3">
                                  <div className="mb-2">
                                    <span className="font-medium text-gray-700">
                                      Title:
                                    </span>
                                    <div className="mt-1 text-gray-900">
                                      {item.originalTitle}
                                    </div>
                                  </div>
                                  {item.originalBody && (
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Body:
                                      </span>
                                      <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                                        {item.originalBody}
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        `${item.originalTitle}\n\n${
                                          item.originalBody || ""
                                        }`,
                                        "Original content"
                                      )
                                    }
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy original
                                  </button>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  Rewritten Content
                                </h4>
                                <div className="bg-white border rounded-lg p-3">
                                  <div className="mb-2">
                                    <span className="font-medium text-gray-700">
                                      Title:
                                    </span>
                                    <div className="mt-1 text-gray-900">
                                      {item.rewrittenTitle}
                                    </div>
                                  </div>
                                  {item.rewrittenBody && (
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        Body:
                                      </span>
                                      <div className="mt-1 text-gray-900 whitespace-pre-wrap">
                                        {item.rewrittenBody}
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        `${item.rewrittenTitle}\n\n${
                                          item.rewrittenBody || ""
                                        }`,
                                        "Rewritten content"
                                      )
                                    }
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy rewritten
                                  </button>
                                </div>
                              </div>
                              {item.changes && item.changes.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    Changes Made
                                  </h4>
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {item.changes.map(
                                      (change: string, index: number) => (
                                        <li key={index}>{change}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Copy Success Toast */}
        {copySuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50">
            <Check className="w-4 h-4 mr-2" />
            {copySuccess}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-reddit rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold text-white">RedditFit</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Make every Reddit post rule-proof with AI-powered rewriting.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col">
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <div className="flex flex-col space-y-2">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div className="flex flex-col">
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <div className="flex flex-col space-y-2">
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <div className="text-sm text-gray-400">
              © 2024 RedditFit. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
