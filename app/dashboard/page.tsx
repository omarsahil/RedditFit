"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const { user, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCancelled, setShowPaymentCancelled] = useState(false);

  useEffect(() => {
    // Check for payment success/cancelled parameters
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      setShowPaymentSuccess(true);
      // Hide success message after 5 seconds
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    } else if (paymentStatus === "cancelled") {
      setShowPaymentCancelled(true);
      // Hide cancelled message after 5 seconds
      setTimeout(() => setShowPaymentCancelled(false), 5000);
    }
  }, [searchParams]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Payment Success Message */}
      {showPaymentSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-green-900">
                Payment Successful!
              </h3>
              <p className="text-sm text-green-700">
                Your Pro subscription has been activated. You now have unlimited
                rewrites!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Cancelled Message */}
      {showPaymentCancelled && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900">
                Payment Cancelled
              </h3>
              <p className="text-sm text-yellow-700">
                Your payment was cancelled. You can try again anytime.
              </p>
            </div>
          </div>
        </div>
      )}

      <DashboardClient />
    </div>
  );
}
