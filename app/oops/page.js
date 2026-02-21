"use client";

import Link from "next/link";

export default function OopsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 text-center">
          <div className="text-6xl mb-4">😵‍💫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            Sorry — we couldn't load that page. We've logged the issue. Try
            refreshing or return to the homepage.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="gradient-button px-5 py-2">
              Go Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
