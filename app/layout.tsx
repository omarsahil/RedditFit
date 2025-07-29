import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "../lib/init"; // Initialize technical infrastructure
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import StructuredData from "./structured-data";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "RedditFit - AI-Powered Reddit Post Optimizer",
    template: "%s | RedditFit",
  },
  description:
    "AI-powered assistant that rewrites your Reddit posts to comply with subreddit rules and boost karma. Get more upvotes with rule-compliant content.",
  keywords: [
    "Reddit",
    "AI",
    "post optimizer",
    "subreddit rules",
    "karma boost",
    "content compliance",
    "Reddit bot",
    "post rewriting",
    "social media",
    "content creation",
  ],
  authors: [{ name: "RedditFit Team" }],
  creator: "RedditFit",
  publisher: "RedditFit",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://reddit-fit.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://reddit-fit.vercel.app",
    title: "RedditFit - AI-Powered Reddit Post Optimizer",
    description:
      "AI-powered assistant that rewrites your Reddit posts to comply with subreddit rules and boost karma.",
    siteName: "RedditFit",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RedditFit - AI-Powered Reddit Post Optimizer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RedditFit - AI-Powered Reddit Post Optimizer",
    description:
      "AI-powered assistant that rewrites your Reddit posts to comply with subreddit rules and boost karma.",
    images: ["/og-image.png"],
    creator: "@redditfit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF4500",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#FF4500" />
        </head>
        <body className={`${inter.className} antialiased`}>
          <StructuredData />
          <PerformanceOptimizer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
