import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "../lib/init"; // Initialize technical infrastructure
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RedditFit - Make Every Reddit Post Rule-Proof",
  description:
    "AI-powered assistant that rewrites your Reddit posts to comply with subreddit rules and boost karma.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
