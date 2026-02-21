"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import PlatformSelector from "../components/PlatformSelector";
import ProductInputCard from "../components/ProductInputCard";
import ToneSelector from "../components/ToneSelector";
import OutputCard from "../components/OutputCard";

export default function GeneratePage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    keyFeatures: "",
    materials: "",
    dimensions: "",
    targetAudience: "",
    tone: "Professional",
    platform: "amazon",
  });

  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        router.push("/auth");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("productDescriptionHistory");
      if (saved) {
        setHistory(JSON.parse(saved).slice(0, 10));
      }
    } catch (err) {
      console.warn("Failed to load history:", err);
    }
  }, []);

  const handleGenerate = async () => {
    if (
      !formData.productName ||
      !formData.category ||
      !formData.keyFeatures
    ) {
      setError("Please fill in the required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          productName: formData.productName,
          category: formData.category,
          keyFeatures: formData.keyFeatures,
          materials: formData.materials,
          dimensions: formData.dimensions,
          targetAudience: formData.targetAudience,
          tone: formData.tone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate description"
        );
      }

      const data = await response.json();
      const description = Array.isArray(data.descriptions)
        ? data.descriptions[0]
        : data.description;
      
      setGenerated(description);

      // Save to history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        productName: formData.productName,
        category: formData.category,
        tone: formData.tone,
        platform: formData.platform,
        description: description,
      };
      const updatedHistory = [historyItem, ...history].slice(0, 25);
      setHistory(updatedHistory);
      try {
        localStorage.setItem(
          "productDescriptionHistory",
          JSON.stringify(updatedHistory)
        );
      } catch (err) {
        console.warn("Failed to save history:", err);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generated) {
      const element = document.createElement("a");
      const file = new Blob([generated], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${formData.productName.replace(/\s+/g, "_")}_${formData.platform}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleRegenerate = () => {
    setGenerated(null);
    setTimeout(() => handleGenerate(), 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-6 relative z-10">
      <Header />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4">
            Generate Compelling Product Descriptions
          </h1>
          <p className="text-gray-400 text-lg">
            AI-powered descriptions for Amazon, eBay, and Shopify in seconds
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN - Input */}
          <div className="space-y-6">
            {/* Platform Selector */}
            <PlatformSelector
              value={formData.platform}
              onChange={(value) =>
                setFormData({ ...formData, platform: value })
              }
            />

            {/* Product Input Card */}
            <ProductInputCard formData={formData} onChange={setFormData} />

            {/* Tone Selector */}
            <ToneSelector
              value={formData.tone}
              onChange={(value) => setFormData({ ...formData, tone: value })}
            />

            {/* Error Message */}
            {error && (
              <div className="glass-card p-4 border-l-4 border-red-500">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gradient-button py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Description
                </>
              )}
            </button>

            {/* Pro Tip Banner */}
            <div className="glass-card p-4 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 flex items-start gap-3">
              <span className="text-lg">✨</span>
              <p className="text-sm text-gray-300">
                <strong>Pro tip:</strong> Include unique selling points and target
                customer pain points for more persuasive descriptions
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN - Output */}
          <div>
            <OutputCard
              platform={formData.platform}
              description={generated}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
            />

            {copied && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-sm text-center">
                ✓ Copied to clipboard!
              </div>
            )}

            {/* Recent Generations */}
            {history.length > 0 && (
              <div className="mt-8">
                <h3 className="text-white font-semibold mb-4">Recent Generations</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGenerated(item.description)}
                      className="w-full text-left glass-card p-3 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {item.productName}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {item.category} • {item.timestamp}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          item.platform === 'amazon'
                            ? 'platform-badge-amazon'
                            : item.platform === 'ebay'
                            ? 'platform-badge-ebay'
                            : 'platform-badge-shopify'
                        }`}>
                          {item.platform}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
