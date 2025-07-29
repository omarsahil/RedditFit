"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface SubscriptionData {
  id: string;
  status: string;
  planId: string;
  planName: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionManager() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription");

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else if (response.status === 404) {
        // No subscription found
        setSubscription(null);
      } else {
        throw new Error("Failed to fetch subscription");
      }
    } catch (err) {
      setError("Failed to load subscription information");
      console.error("Subscription fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCancelling(true);
      const response = await fetch(
        `/api/subscription/${subscription.id}/cancel`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Refresh subscription data
        await fetchSubscription();
      } else {
        throw new Error("Failed to cancel subscription");
      }
    } catch (err) {
      setError("Failed to cancel subscription");
      console.error("Cancel subscription error:", err);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-reddit" />
          <span className="ml-2 text-gray-600">Loading subscription...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 mb-4">
            You're currently on the free plan. Upgrade to unlock premium
            features.
          </p>
          <a href="/pricing" className="btn-primary">
            View Plans
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CreditCard className="w-6 h-6 text-reddit mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Subscription Details
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {subscription.status === "active" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
          )}
          {subscription.cancelAtPeriodEnd && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Cancelling
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Plan:</span>
          <span className="font-semibold">{subscription.planName}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <span className="capitalize">{subscription.status}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {subscription.cancelAtPeriodEnd ? "Access until:" : "Next billing:"}
          </span>
          <span>{formatDate(subscription.currentPeriodEnd)}</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          {!subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="btn-secondary flex items-center"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </button>
          )}

          <a href="/pricing" className="btn-primary flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Plan
          </a>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              Your subscription will be cancelled on{" "}
              {formatDate(subscription.currentPeriodEnd)}. You can reactivate it
              anytime before then.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
