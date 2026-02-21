"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    try { router.replace('/'); } catch (e) {}
    setShowMenu(false);
  };

  return (
    <header className="fixed top-0 w-full z-40">
      <div className="glass-card mx-4 mt-4 !rounded-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div onClick={(e) => { e.preventDefault(); router.push('/'); }} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg glow-effect cursor-pointer">
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <div className="text-lg font-bold text-white hidden sm:block">DescribeAI</div>
            </div>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Credits Pill */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z" />
                  </svg>
                  <span className="text-sm font-medium text-white">Free to use</span>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold"
                  >
                    {user.email?.[0]?.toUpperCase()}
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 z-50">
                      <div className="bg-black/70 border border-white/12 rounded-xl backdrop-blur-md overflow-hidden">
                        <div className="p-3 border-b border-white/10">
                          <div className="text-sm text-gray-300">Signed in as</div>
                          <div className="text-sm font-semibold text-white truncate">
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-all"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="gradient-button text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
