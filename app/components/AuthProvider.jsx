"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signOutClient, onAuthChange } from "../../lib/firebase-client";

const AuthContext = createContext(null);

// We use Firebase Auth so no client-side password hashing is necessary
async function hashPassword(password) {
  return null;
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

    // Sync with Firebase Auth state
    const unsub = onAuthChange((user) => {
      if (user) {
        const email = user.email;
        setUser({ email });
        localStorage.setItem("currentUser", JSON.stringify({ email }));
      } else {
        setUser(null);
        try { localStorage.removeItem("currentUser"); } catch(e){}
      }
    });
    return () => unsub && unsub();
  }, []);

  // Expose Google sign-in for the app UI
  const signinWithGoogle = async () => {
    const result = await signInWithGoogle();
    // request demo token from server (optional)
    try {
      const res = await fetch('/api/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: result.email }) });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('demo_token', data.token);
          setToken(data.token);
        }
      }
    } catch (e) {}
    if (result.email) {
      localStorage.setItem("currentUser", JSON.stringify({ email: result.email }));
      setUser({ email: result.email });
    }
    return result;
  };

  const logout = async () => {
    try { await signOutClient(); } catch (e) {}
    try { localStorage.removeItem("currentUser"); } catch (e) {}
    try { localStorage.removeItem('demo_token'); } catch (e) {}
    setToken(null);
    setUser(null);
  };
  const open = () => router.push('/auth');

  return (
    <AuthContext.Provider value={{ user, token, signinWithGoogle, logout, open }}>
      {children}

      {/* Floating auth control removed to avoid duplicate avatar — header handles auth UI */}
    </AuthContext.Provider>
  );
}

