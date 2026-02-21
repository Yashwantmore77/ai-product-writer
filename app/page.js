"use client";

import Link from "next/link";
import { useAuth } from "./components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/generate");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo Section */}
        <div className="text-center mb-16">
          <div className="inline-flex mb-6">
            <Link href="/" className="group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl glow-effect animate-pulse">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </Link>
          </div>
          <h1 className="text-5xl font-bold gradient-title mb-4">DescribeAI</h1>
          <p className="text-xl text-gray-300 mb-2">
            Generate Compelling Product Descriptions
          </p>
          <p className="text-gray-400">
            AI-powered descriptions for Amazon, eBay, and Shopify in seconds
          </p>
        </div>

        {/* Main CTA */}
        <div className="text-center mb-12">
          <Link href="/auth" className="inline-flex items-center gap-2 gradient-button text-lg">
            <span>Get Started Free</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-4">
              <span className="text-2xl">🏪</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Multi-Platform</h3>
            <p className="text-gray-400 text-sm">
              Generate descriptions tailored for Amazon, eBay, and Shopify formats
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400 text-sm">
              Get professional descriptions in under 10 seconds
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
              <span className="text-2xl">✍️</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Tone Control</h3>
            <p className="text-gray-400 text-sm">
              Choose from Professional, Casual, Luxury, or Fun tones
            </p>
          </div>
        </div>

        {/* Free Plan Message */}
        <div className="glass-card p-8 mb-12 text-center">
          <h3 className="text-2xl text-white font-bold mb-3">This app is free to use</h3>
          <p className="text-gray-400 mb-4">All features are available at no cost.</p>
          <div className="max-w-xl mx-auto">
            <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                All platforms: Amazon, eBay & Shopify
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                All tones: Professional, Casual, Luxury, Fun
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                Generated quickly — under 10 seconds
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                Unlimited generations
              </li>
            </ul>
          </div>
        </div>

        {/* Social Proof */}
        <div className="glass-card p-6 text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🛍️</span>
          </div>
          <p className="text-white font-semibold">Join 1,200+ online sellers using DescribeAI</p>
          <p className="text-gray-400 text-sm mt-1">50,000+ product descriptions generated</p>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 gradient-button"
          >
            <span>Start Generating Now</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            No credit card required • Free to get started
          </p>
        </div>
      </div>
    </div>
  );
}

