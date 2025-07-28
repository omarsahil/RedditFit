import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-reddit hover:text-reddit/80 font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing and using RedditFit ("the Service"), you accept and
                agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 mb-4">
                RedditFit is an AI-powered tool that helps users rewrite Reddit
                posts to comply with subreddit rules. The Service analyzes your
                content and provides suggestions for improvement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. User Accounts
              </h2>
              <p className="text-gray-700 mb-4">
                You are responsible for maintaining the confidentiality of your
                account and password. You agree to accept responsibility for all
                activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Free Plan Limitations
              </h2>
              <p className="text-gray-700 mb-4">
                The free plan includes 1 rewrite per day. Additional rewrites
                require a paid subscription. We reserve the right to modify
                these limits at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. User Content
              </h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of your content. By using our Service, you
                grant us a limited license to process your content for the
                purpose of providing the rewriting service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Prohibited Uses
              </h2>
              <p className="text-gray-700 mb-4">
                You may not use the Service to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Generate harmful, offensive, or inappropriate content</li>
                <li>Attempt to reverse engineer or hack the Service</li>
                <li>Use the Service for spam or harassment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Privacy
              </h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                8. Disclaimers
              </h2>
              <p className="text-gray-700 mb-4">
                The Service is provided "as is" without warranties of any kind.
                We do not guarantee that rewritten content will be approved by
                Reddit or any subreddit moderators.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                In no event shall RedditFit be liable for any indirect,
                incidental, special, consequential, or punitive damages arising
                out of or relating to your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                10. Changes to Terms
              </h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will
                notify users of any material changes via email or through the
                Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                11. Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please
                contact us at support@redditfit.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
