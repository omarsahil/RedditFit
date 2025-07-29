"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentFormProps {
  planId: string;
  planName: string;
  price: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  planId,
  planName,
  price,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      setError("You must be logged in to make a payment");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create payment intent
      const response = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Redirect to DodoPayment checkout
      const checkoutUrl = `https://checkout.dodopayment.com/pay/${paymentIntentId}?client_secret=${clientSecret}&return_url=${encodeURIComponent(
        window.location.origin + "/dashboard"
      )}`;

      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price / 100);
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-green-700 mb-4">
          Your {planName} subscription has been activated. You now have access
          to all premium features.
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="text-center mb-6">
        <CreditCard className="w-12 h-12 text-reddit mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Subscribe to {planName}
        </h3>
        <p className="text-gray-600">
          Get unlimited access to RedditFit's premium features
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Plan:</span>
          <span className="font-semibold">{planName}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-700">Price:</span>
          <span className="text-2xl font-bold text-reddit">
            {formatPrice(price)}/month
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Redirecting to Checkout...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Continue to Checkout
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Your payment is secure and encrypted. You can cancel your subscription
          at any time.
        </p>
      </div>
    </div>
  );
}
