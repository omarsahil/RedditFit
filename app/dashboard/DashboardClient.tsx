"use client";

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PostRewriter } from "@/components/PostRewriter";

export default function DashboardClient() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

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

  // Diagnostic state
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to access your dashboard
          </h1>
          <p className="text-gray-600">
            You need to be signed in to view your RedditFit dashboard.
          </p>
        </div>
      </div>
    );
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

        {/* Error Display */}
        {userPlan === null && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Dashboard Loading Issue
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {!userPlan && (
                    <p>
                      User plan not loaded. This might be a database connection
                      issue.
                    </p>
                  )}
                  <p className="mt-2">
                    <button
                      onClick={runDiagnostic}
                      className="text-red-800 underline hover:text-red-900"
                    >
                      Run diagnostic to identify the issue
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Copy Success Toast */}
        {/* Removed copy success toast as it was tied to history */}
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
