import Link from "next/link";
import { ArrowLeft, Users, Zap, Shield, TrendingUp } from "lucide-react";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-reddit rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RedditFit</span>
            </div>
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About RedditFit
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We're on a mission to help Redditors create better, more compliant
            content that gets the engagement it deserves.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  RedditFit was born from a simple frustration: too many great
                  posts getting removed due to rule violations. We've all been
                  there - you spend time crafting the perfect post, only to have
                  it taken down minutes later.
                </p>
                <p>
                  Our team of Reddit enthusiasts and AI experts came together to
                  solve this problem. We built an AI system that understands
                  subreddit rules and automatically optimizes your content for
                  maximum compliance and engagement.
                </p>
                <p>
                  Today, RedditFit helps thousands of Redditors create
                  rule-proof content that gets the attention it deserves.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-reddit/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-reddit" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Built by Redditors
                </h3>
                <p className="text-gray-600">
                  Our team has been active on Reddit for years, experiencing the
                  same challenges you face every day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600">
              To democratize quality content creation on Reddit by making rule
              compliance accessible to everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-gray-600">
                We continuously improve our AI to understand the ever-evolving
                landscape of Reddit rules and community standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality</h3>
              <p className="text-gray-600">
                We maintain high standards for content quality while ensuring
                compliance with community guidelines.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Growth</h3>
              <p className="text-gray-600">
                We help Redditors grow their karma and build meaningful
                connections through better content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600">
              A small team with big ambitions for the Reddit community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-reddit rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">O</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Omar Sahil</h3>
                  <p className="text-sm text-gray-600">Founder & Developer</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Reddit enthusiast and full-stack developer passionate about
                building tools that make the internet better.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <span className="text-gray-600 font-bold">AI</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-sm text-gray-600">Content Optimization</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Our advanced AI system that analyzes thousands of subreddit
                rules and optimizes your content for maximum compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Have questions, suggestions, or just want to say hello? We'd love to
            hear from you.
          </p>

          <div className="space-y-4">
            <a
              href="mailto:rfitappteam@gmail.com"
              className="inline-flex items-center text-reddit hover:text-reddit/80 font-medium"
            >
              rfitappteam@gmail.com
            </a>
            <div className="text-gray-600">
              <p>We typically respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
