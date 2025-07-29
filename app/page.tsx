import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import {
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  Star,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-reddit rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RedditFit</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary">Get Started</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="btn-secondary">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="btn-primary text-sm px-4 py-2">
                    Start
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-reddit/5 to-orange-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Make Every Reddit Post
              <span className="text-reddit block">Rule-Proof</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              AI-powered assistant that rewrites your Reddit posts to comply
              with subreddit rules, increasing acceptance rates and boosting
              karma.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                    Start Writing Better Posts
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto inline-flex items-center justify-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </SignedIn>
              <button className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                Watch Demo
              </button>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500 px-4">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />3 free
                rewrites per day
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Works with any subreddit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why Your Posts Get Removed
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Every subreddit has unique rules. RedditFit learns them all and
              rewrites your content to fit perfectly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="card text-center p-6 sm:p-8">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">
                Rule Compliance
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Automatically checks your post against subreddit rules and fixes
                violations before you submit.
              </p>
            </div>

            <div className="card text-center p-6 sm:p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">
                AI Rewriting
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Smart AI rewrites your content while preserving your message and
                improving readability.
              </p>
            </div>

            <div className="card text-center p-6 sm:p-8">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">
                Karma Boost
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Rule-compliant posts get better engagement, leading to more
                upvotes and karma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* See App in Action Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See RedditFit in Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch how RedditFit transforms your posts to comply with subreddit
              rules and boost engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Before/After Example */}
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm font-semibold text-red-700">
                    BEFORE - Multiple Rule Violations
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  "Just got my first 100 customers! Here's how I built my app in
                  2 weeks and made $10k"
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Posted to r/startups
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Violates "No Success Story" rule without proper format
                  </div>
                  <div className="flex items-center text-sm text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Missing required "How I Built" flair
                  </div>
                  <div className="flex items-center text-sm text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Claims need verification and detailed breakdown
                  </div>
                  <div className="flex items-center text-sm text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Should include specific metrics and lessons learned
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-semibold text-green-700">
                    AFTER - RedditFit Optimized
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  "[How I Built] Reached 100 customers in 2 weeks: My journey
                  building a productivity app"
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Posted to r/startups
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Proper "How I Built" flair for success stories
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Includes specific metrics and timeline
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Focuses on journey and lessons learned
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    97% compliance score
                  </div>
                </div>
              </div>
            </div>

            {/* Features Demo */}
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-reddit/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-reddit" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-600">
                  Our AI analyzes 1000+ subreddit rules in real-time to ensure
                  your posts comply with community guidelines.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Instant Optimization
                </h3>
                <p className="text-gray-600">
                  Get rewritten posts in seconds with detailed explanations of
                  what was changed and why.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Higher Success Rate
                </h3>
                <p className="text-gray-600">
                  Users report 3x higher post approval rates and 2x more
                  engagement after using RedditFit.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 bg-gradient-to-r from-reddit/5 to-orange-50 rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-reddit mb-2">10K+</div>
                <div className="text-sm text-gray-600">Posts Optimized</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-reddit mb-2">95%</div>
                <div className="text-sm text-gray-600">Approval Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-reddit mb-2">500+</div>
                <div className="text-sm text-gray-600">
                  Subreddits Supported
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-reddit mb-2">2.5x</div>
                <div className="text-sm text-gray-600">More Engagement</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="btn-primary text-lg px-8 py-4">
                  Try RedditFit Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </SignedIn>
            <p className="text-sm text-gray-500 mt-3">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="card">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <div className="text-3xl font-bold mb-4">$0</div>
                <p className="text-gray-600 mb-6">
                  Perfect for casual Reddit users
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">3 free rewrites per day</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Basic rule checking</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">AI rewriting</span>
                  </li>
                </ul>

                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="btn-secondary w-full">
                      Get Started Free
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="btn-secondary w-full block text-center"
                  >
                    Current Plan
                  </Link>
                </SignedIn>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="card border-2 border-reddit relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-reddit text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-4">
                  $9.99<span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">
                  For power users and content creators
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Unlimited rewrites</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Advanced AI models</span>
                    <Link href="/pricing">
                      <Lock className="w-3 h-3 text-gray-400 ml-1 hover:text-reddit cursor-pointer transition-colors" />
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Bulk rewrite mode</span>
                    <Link href="/pricing">
                      <Lock className="w-3 h-3 text-gray-400 ml-1 hover:text-reddit cursor-pointer transition-colors" />
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Custom AI tones</span>
                    <Link href="/pricing">
                      <Lock className="w-3 h-3 text-gray-400 ml-1 hover:text-reddit cursor-pointer transition-colors" />
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Priority processing</span>
                    <Link href="/pricing">
                      <Lock className="w-3 h-3 text-gray-400 ml-1 hover:text-reddit cursor-pointer transition-colors" />
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Advanced analytics</span>
                    <Link href="/pricing">
                      <Lock className="w-3 h-3 text-gray-400 ml-1 hover:text-reddit cursor-pointer transition-colors" />
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Compliance scoring</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Post history</span>
                  </li>
                </ul>

                <Link
                  href="/pricing"
                  className="btn-primary w-full block text-center"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-reddit">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Stop Getting Your Posts Removed?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of Redditors who've boosted their karma with
            rule-compliant posts.
          </p>

          <SignedOut>
            <SignUpButton mode="modal">
              <button className="bg-white text-reddit hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200">
                Start Your Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-white text-reddit hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 inline-flex items-center"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </SignedIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
