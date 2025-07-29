"use client";

import { useState } from "react";
import { Check, Clock, Star, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Replace the handlePlanSelect function with direct redirect for 'pro' plan
  const handlePlanSelect = (planId: string) => {
    if (!isSignedIn) {
      // Redirect to sign in if user is not authenticated
      window.location.href = "/sign-in?redirect=/pricing";
      return;
    }

    if (planId === "pro-monthly") {
      // Redirect directly to DodoPayments checkout
      const productId = "pdt_1YatYZDS2O1kCtd53stEM";
      const redirectUrl =
        typeof window !== "undefined"
          ? window.location.origin + "/dashboard"
          : "https://reddit-fit.vercel.app/dashboard";
      window.location.href = `https://checkout.dodopayments.com/buy/${productId}?quantity=1&redirect_url=${encodeURIComponent(
        redirectUrl
      )}`;
      return;
    }

    setIsProcessing(planId);

    // If you have other plans, handle them here
  };

  const getPlanFeatures = (planId: string) => {
    switch (planId) {
      case "free":
        return [
          "3 free rewrites per day",
          "Basic AI optimization",
          "Subreddit rules analysis",
          "Compliance scoring",
          "Rewrite history",
        ];
      case "pro-monthly":
        return [
          "Unlimited rewrites",
          "Advanced AI models",
          "Bulk rewrite mode",
          "Custom AI tones",
          "Priority processing",
          "Advanced analytics",
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your Reddit posting needs. All plans
            include our core AI-powered optimization features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <p className="text-gray-600">Perfect for getting started</p>
            </div>

            <ul className="space-y-4 mb-8">
              {getPlanFeatures("free").map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
              <li className="flex items-center opacity-50">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-500">Direct Reddit posting</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </li>
            </ul>

            <Link
              href="/dashboard"
              className="w-full btn-primary text-center block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-xl border-2 border-reddit p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-reddit text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
              <p className="text-gray-600">per month</p>
            </div>

            <ul className="space-y-4 mb-8">
              {getPlanFeatures("pro-monthly").map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                  <Lock className="w-4 h-4 text-gray-400 ml-2" />
                </li>
              ))}
              <li className="flex items-center opacity-50">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-500">Direct Reddit posting</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </li>
              <li className="flex items-center opacity-50">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-500">Scheduled posting</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Coming Soon
                </span>
              </li>
            </ul>

            <button
              onClick={() => handlePlanSelect("pro-monthly")}
              disabled={isProcessing === "pro-monthly"}
              className="w-full bg-reddit hover:bg-reddit/90 text-white font-semibold py-3 px-4 rounded-lg text-center block transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing === "pro-monthly" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  Processing...
                </>
              ) : (
                "Start Pro Trial"
              )}
            </button>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              🚀 Coming Soon: Direct Reddit Integration
            </h2>
            <p className="text-blue-800 mb-6 max-w-2xl mx-auto">
              We're working hard to bring you the ability to post directly to
              Reddit from RedditFit. This will include scheduled posting,
              cross-posting, and real-time performance tracking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📝 Direct Posting
                </h3>
                <p className="text-blue-700 text-sm">
                  Post your optimized content directly to Reddit with one click
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ⏰ Scheduled Posts
                </h3>
                <p className="text-blue-700 text-sm">
                  Schedule posts for optimal timing and maximum engagement
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📊 Performance Tracking
                </h3>
                <p className="text-blue-700 text-sm">
                  Track upvotes, comments, and engagement in real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                When will direct Reddit posting be available?
              </h3>
              <p className="text-gray-600">
                We're targeting Q1 2024 for the initial release of direct Reddit
                posting. This will include basic posting functionality, with
                advanced features like scheduling and analytics following
                shortly after.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Will I need to pay extra for direct posting?
              </h3>
              <p className="text-gray-600">
                Direct Reddit posting will be included in Pro plans at no
                additional cost. Free users will have limited posting
                capabilities.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my Reddit account secure?
              </h3>
              <p className="text-gray-600">
                Yes! We use Reddit's official OAuth2 authentication, which means
                we never see your password. You can revoke access at any time
                from your Reddit account settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can cancel your subscription at any time from
                your account settings. You'll continue to have access until the
                end of your billing period.
              </p>
            </div>
          </div>
        </div>
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
              <div className="space-y-2">
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Dashboard
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
    </div>
  );
}
