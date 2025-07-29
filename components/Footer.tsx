"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/email/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setEmail("");
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        setError(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

            {/* Email Signup */}
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Stay Updated
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Get tips, updates, and exclusive content delivered to your
                inbox.
              </p>

              {isSuccess ? (
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Successfully subscribed!
                </div>
              ) : (
                <form onSubmit={handleEmailSignup} className="space-y-2">
                  <div className="flex">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l text-sm text-white placeholder-gray-400 focus:outline-none focus:border-reddit"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-2 bg-reddit hover:bg-reddit/90 disabled:opacity-50 rounded-r text-white text-sm transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                </form>
              )}
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col">
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="/pricing"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/test"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Test Rewriter
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="flex flex-col">
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <div className="flex flex-col space-y-2">
              <a
                href="mailto:rfitappteam@gmail.com"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Contact Us
              </a>
              <a
                href="https://github.com/omarsahil/RedditFit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                GitHub
              </a>
              <Link
                href="/about"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                About
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
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <div className="text-sm text-gray-400">
            © 2024 RedditFit. All rights reserved. | Made with ❤️ for Reddit
            community
          </div>
        </div>
      </div>
    </footer>
  );
}
