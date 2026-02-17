"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

async function hashPassword(password) {
  if (!password) return "";
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    try {
      const cu = localStorage.getItem("currentUser");
      if (cu) setUser(JSON.parse(cu));
      const t = localStorage.getItem('demo_token');
      if (t) setToken(t);
    } catch (e) {}
  }, []);
  const signup = async ({ username, password }) => {
    if (!username || !password) throw new Error("Username and password required");
    const usersRaw = localStorage.getItem("localUsers");
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    if (users.find((u) => u.username === username)) {
      throw new Error("Username already exists");
    }
    const hash = await hashPassword(password);
    const newUser = { username, passwordHash: hash, createdAt: Date.now() };
    users.push(newUser);
    localStorage.setItem("localUsers", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify({ username }));
    setUser({ username });
    // request demo token from server
    try {
      const res = await fetch('/api/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
      if (res.ok) {
        const data = await res.json();
        const t = data.token;
        if (t) {
          localStorage.setItem('demo_token', t);
          setToken(t);
        }
      }
    } catch (e) {}
    return { username };
  };

  const login = async ({ username, password }) => {
    if (!username || !password) throw new Error("Username and password required");
    const usersRaw = localStorage.getItem("localUsers");
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    const found = users.find((u) => u.username === username);
    if (!found) throw new Error("No such user");
    const hash = await hashPassword(password);
    if (hash !== found.passwordHash) throw new Error("Invalid credentials");
    localStorage.setItem("currentUser", JSON.stringify({ username }));
    setUser({ username });
    try {
      const res = await fetch('/api/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
      if (res.ok) {
        const data = await res.json();
        const t = data.token;
        if (t) {
          localStorage.setItem('demo_token', t);
          setToken(t);
        }
      }
    } catch (e) {}
    return { username };
  };

  const logout = () => {
    try { localStorage.removeItem("currentUser"); } catch (e) {}
    try { localStorage.removeItem('demo_token'); } catch (e) {}
    setToken(null);
    setUser(null);
  };
  const open = () => router.push('/auth');

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout, open }}>
      {children}

      {/* Floating auth button (navigates to /auth) */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2">
          {user ? (
            <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full text-sm text-white">
              <span className="font-medium">{user.username}</span>
              <button onClick={logout} className="text-xs px-2 py-1 rounded bg-rose-600/80">Logout</button>
            </div>
          ) : (
            <button onClick={open} className="px-3 py-2 rounded-full bg-emerald-500 text-white text-sm">Login / Signup</button>
          )}
        </div>
      </div>
    </AuthContext.Provider>
  );
}

