"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function TestPage() {
  const { user, isSignedIn } = useUser();
  const [userPlan, setUserPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const fetchUserPlan = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    try {
      const response = await fetch("/api/user/plan");
      if (response.ok) {
        const plan = await response.json();
        setUserPlan(plan);
        setTestResult("✅ User plan fetched successfully");
      } else {
        setTestResult("❌ Failed to fetch user plan");
      }
    } catch (error) {
      setTestResult("❌ Error fetching user plan");
    } finally {
      setLoading(false);
    }
  };

  const testPaymentFlow = async () => {
    if (!isSignedIn) {
      setTestResult("❌ User not signed in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId: "pro-monthly" }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(
          `✅ Payment intent created: ${
            data.checkoutUrl ? "Checkout URL generated" : "No checkout URL"
          }`
        );
      } else {
        const error = await response.json();
        setTestResult(`❌ Payment intent failed: ${error.error}`);
      }
    } catch (error) {
      setTestResult("❌ Error creating payment intent");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchUserPlan();
    }
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Payment Flow Test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Signed In:</strong> {isSignedIn ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id || "N/A"}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {user?.emailAddresses?.[0]?.emailAddress || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : userPlan ? (
            <div className="space-y-2">
              <p>
                <strong>Plan:</strong> {userPlan.plan}
              </p>
              <p>
                <strong>Rewrites Used:</strong> {userPlan.rewritesUsed}
              </p>
              <p>
                <strong>Rewrites Limit:</strong>{" "}
                {userPlan.rewritesLimit === -1
                  ? "Unlimited"
                  : userPlan.rewritesLimit}
              </p>
              <p>
                <strong>Can Rewrite:</strong>{" "}
                {userPlan.canRewrite ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Reset Date:</strong>{" "}
                {new Date(userPlan.resetDate).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">No plan data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={fetchUserPlan}
              disabled={loading || !isSignedIn}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Refresh User Plan
            </button>

            <button
              onClick={testPaymentFlow}
              disabled={loading || !isSignedIn}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 ml-4"
            >
              Test Payment Flow
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <div
              className={`p-4 rounded-lg ${
                testResult.includes("✅")
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="font-mono text-sm">{testResult}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm font-mono">
            <p>
              <strong>DODOPAYMENT_API_KEY:</strong>{" "}
              {process.env.NEXT_PUBLIC_DODOPAYMENT_API_KEY
                ? "✅ Set"
                : "❌ Not set"}
            </p>
            <p>
              <strong>DODOPAYMENT_ENVIRONMENT:</strong>{" "}
              {process.env.NEXT_PUBLIC_DODOPAYMENT_ENVIRONMENT || "Not set"}
            </p>
            <p>
              <strong>NEXT_PUBLIC_APP_URL:</strong>{" "}
              {process.env.NEXT_PUBLIC_APP_URL || "Not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
