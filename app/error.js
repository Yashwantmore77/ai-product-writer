"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    try {
      console.error("Unhandled error:", error);
    } catch (e) {}
    // Immediately replace the route with a friendly error page.
    // Using replace avoids creating an extra history entry.
    router.replace("/oops");
  }, [error, router]);

  return null;
}
