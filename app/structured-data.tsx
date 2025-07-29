export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RedditFit",
    description:
      "AI-powered assistant that rewrites your Reddit posts to comply with subreddit rules and boost karma",
    url: "https://reddit-fit.vercel.app",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan with 3 rewrites per day",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Organization",
      name: "RedditFit Team",
      email: "rfitappteam@gmail.com",
    },
    publisher: {
      "@type": "Organization",
      name: "RedditFit",
      url: "https://reddit-fit.vercel.app",
    },
    featureList: [
      "AI-powered post rewriting",
      "Subreddit rule compliance",
      "Karma optimization",
      "Real-time analysis",
      "Multiple AI models",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
