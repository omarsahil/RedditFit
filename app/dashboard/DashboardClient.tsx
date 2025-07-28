"use client";

import { PostRewriter } from "@/components/PostRewriter";
import { useState, useEffect } from "react";

interface Post {
  id: string;
  originalTitle: string;
  rewrittenTitle: string;
  subreddit: string;
  complianceScore: number;
  createdAt: string;
}

interface Analytics {
  totalRewrites: number;
  averageCompliance: number;
  topSubreddits: Array<{ subreddit: string; count: number }>;
  recentTrends: Array<{ date: string; rewrites: number }>;
}

export default function DashboardClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            RedditFit Dashboard
          </h1>
          <p className="text-gray-600 text-readable">
            Welcome back! Here's your RedditFit overview.
          </p>
        </div>

        <div className="layout-responsive">
          {/* Main Content - Post Rewriter */}
          <div className="lg:col-span-2">
            <PostRewriter />
          </div>

          {/* Analytics Sidebar */}
          <div className="lg:col-span-1">
            <DashboardAnalytics />
          </div>
        </div>

        {/* User History */}
        <div className="mt-8 lg:mt-12">
          <UserHistory />
        </div>
      </div>
    </div>
  );
}

function DashboardAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics");
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loadingAnalytics) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-reddit"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-600 text-readable">
            Unable to load analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="card">
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600">
              {analytics.totalRewrites}
            </div>
            <div className="text-sm lg:text-base text-blue-700 font-medium">
              Total Rewrites
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl lg:text-3xl font-bold text-green-600">
              {analytics.averageCompliance}%
            </div>
            <div className="text-sm lg:text-base text-green-700 font-medium">
              Avg Compliance
            </div>
          </div>
        </div>
      </div>

      {/* Top Subreddits */}
      {analytics.topSubreddits.length > 0 && (
        <div className="card">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
            Top Subreddits
          </h3>
          <div className="space-y-3">
            {analytics.topSubreddits.slice(0, 5).map((item, index) => (
              <div
                key={item.subreddit}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <span className="text-sm lg:text-base font-medium text-gray-600 mr-2">
                    #{index + 1}
                  </span>
                  <span className="text-sm lg:text-base font-semibold text-gray-900">
                    r/{item.subreddit}
                  </span>
                </div>
                <span className="text-sm lg:text-base font-bold text-reddit">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analytics.recentTrends.length > 0 && (
        <div className="card">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
            This Week
          </h3>
          <div className="space-y-2">
            {analytics.recentTrends.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm lg:text-base text-gray-600">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm lg:text-base font-semibold text-gray-900">
                  {day.rewrites}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserHistory() {
  const [history, setHistory] = useState<Post[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/rewrite/history");
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        } else {
          setHistoryError("Failed to load history");
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
        setHistoryError("Failed to load history");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/rewrite/history?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setHistory(history.filter((post) => post.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loadingHistory) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-reddit"></div>
          <span className="ml-3 text-gray-600 text-readable">
            Loading your history...
          </span>
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-600 text-readable">{historyError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
          Your Rewrite History (RedditFit)
        </h2>
        <span className="text-sm lg:text-base text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {history.length} posts
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-readable mb-2">No rewrites yet</p>
          <p className="text-sm text-gray-500">
            Start by rewriting your first post above!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-responsive">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm lg:text-base">
                  Original Title
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm lg:text-base">
                  Rewritten Title
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm lg:text-base">
                  Subreddit
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm lg:text-base">
                  Compliance
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm lg:text-base">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm lg:text-base">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <p className="text-sm lg:text-base text-gray-900 font-medium break-words">
                        {post.originalTitle}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <p className="text-sm lg:text-base text-gray-900 break-words">
                        {post.rewrittenTitle}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm lg:text-base text-gray-600">
                      r/{post.subreddit}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs lg:text-sm font-medium ${getComplianceColor(
                        post.complianceScore
                      )}`}
                    >
                      {post.complianceScore}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm lg:text-base text-gray-600">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete post"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
