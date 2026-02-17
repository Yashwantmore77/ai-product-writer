"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function AuthPage() {
  const { signup, login, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    // Already logged in, redirect to generate
    if (typeof window !== "undefined") router.push("/generate");
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ username: username.trim(), password });
      } else {
        await signup({ username: username.trim(), password });
      }
      router.push("/generate");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-800 text-slate-100 p-6">
      <div className="w-full max-w-md bg-slate-900/80 border border-white/8 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{mode === 'login' ? 'Login' : 'Sign up'}</h2>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-xs px-2 py-1 rounded bg-white/5">{mode === 'login' ? 'Switch to Sign up' : 'Switch to Login'}</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="text-sm text-rose-400">{error}</div>}
          <div>
            <label className="block text-xs text-slate-300 mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-emerald-500 text-white text-sm">{loading ? '...' : (mode === 'login' ? 'Login' : 'Create account')}</button>
          </div>
          <div className="text-xs text-slate-400">Note: This demo stores accounts in your browser's localStorage only.</div>
        </form>
      </div>
    </div>
  );
}
