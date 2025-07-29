import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

export default function CookiePolicyPage() {
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

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Cookie Policy
            </h1>

            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  What Are Cookies
                </h2>
                <p className="text-gray-600 mb-4">
                  Cookies are small text files that are placed on your device
                  when you visit our website. They help us provide you with a
                  better experience by remembering your preferences and
                  analyzing how you use our site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  How We Use Cookies
                </h2>
                <p className="text-gray-600 mb-4">
                  RedditFit uses cookies for the following purposes:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>
                    <strong>Essential Cookies:</strong> These cookies are
                    necessary for the website to function properly. They enable
                    basic functions like page navigation and access to secure
                    areas.
                  </li>
                  <li>
                    <strong>Authentication Cookies:</strong> We use cookies to
                    remember your login status and preferences when you use our
                    service.
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> These cookies help us
                    understand how visitors interact with our website by
                    collecting and reporting information anonymously.
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> These cookies are used
                    to track visitors across websites to display relevant
                    advertisements.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Types of Cookies We Use
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Session Cookies
                    </h3>
                    <p className="text-gray-600">
                      These cookies are temporary and are deleted when you close
                      your browser. They help maintain your session while you're
                      using our service.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Persistent Cookies
                    </h3>
                    <p className="text-gray-600">
                      These cookies remain on your device for a set period or
                      until you delete them. They help us remember your
                      preferences and provide a personalized experience.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Third-Party Cookies
                    </h3>
                    <p className="text-gray-600">
                      We may use third-party services that place their own
                      cookies on your device. These include analytics services
                      like Google Analytics and payment processors.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Third-Party Services
                </h2>
                <p className="text-gray-600 mb-4">
                  We use the following third-party services that may place
                  cookies on your device:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>
                    <strong>Clerk:</strong> For user authentication and account
                    management
                  </li>
                  <li>
                    <strong>Brevo:</strong> For email marketing and newsletter
                    management
                  </li>
                  <li>
                    <strong>DodoPayments:</strong> For payment processing
                  </li>
                  <li>
                    <strong>OpenRouter:</strong> For AI model inference
                  </li>
                  <li>
                    <strong>Vercel:</strong> For hosting and analytics
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Managing Cookies
                </h2>
                <p className="text-gray-600 mb-4">
                  You can control and manage cookies in several ways:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>
                    <strong>Browser Settings:</strong> Most browsers allow you
                    to refuse cookies or delete them. Check your browser's help
                    section for instructions.
                  </li>
                  <li>
                    <strong>Cookie Consent:</strong> When you first visit our
                    site, you can choose which types of cookies to accept.
                  </li>
                  <li>
                    <strong>Third-Party Opt-Out:</strong> You can opt out of
                    third-party cookies through their respective privacy
                    policies.
                  </li>
                </ul>
                <p className="text-gray-600 mt-4">
                  <strong>Note:</strong> Disabling certain cookies may affect
                  the functionality of our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Updates to This Policy
                </h2>
                <p className="text-gray-600">
                  We may update this Cookie Policy from time to time to reflect
                  changes in our practices or for other operational, legal, or
                  regulatory reasons. We will notify you of any material changes
                  by posting the new policy on this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Contact Us
                </h2>
                <p className="text-gray-600">
                  If you have any questions about our use of cookies, please
                  contact us at{" "}
                  <a
                    href="mailto:rfitappteam@gmail.com"
                    className="text-reddit hover:text-reddit/80"
                  >
                    rfitappteam@gmail.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
