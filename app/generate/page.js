"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  "Clothing",
  "Electronics",
  "Home & Kitchen",
  "Beauty",
  "Sports",
  "Food",
  "Toys",
  "Jewelry",
  "Other",
];

const TONES = ["Professional", "Casual", "Luxury", "Playful", "Minimalist"];

const VARIATION_OPTIONS = [1, 2, 3];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

export default function GeneratePage() {
  const { user, open: openAuth, token } = useAuth();
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    keyFeatures: "",
    targetAudience: "",
    tone: "Professional",
    variations: 1,
  });
  const [descriptions, setDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("txt");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isImageOnly, setIsImageOnly] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  // Chat widget state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); // {role, content, ts}
  const [chatSending, setChatSending] = useState(false);
  const chatInputRef = useRef(null);
  // Safe localStorage helpers
  const hasLocalStorage = typeof window !== "undefined" && !!window.localStorage;
  const safeGet = (k) => {
    if (!hasLocalStorage) return null;
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const safeSet = (k, v) => {
    if (!hasLocalStorage) return;
    try { localStorage.setItem(k, v); } catch (e) {}
  };
  const safeRemove = (k) => {
    if (!hasLocalStorage) return;
    try { localStorage.removeItem(k); } catch (e) {}
  };

  const [lastSeen, setLastSeen] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const saved = safeGet("productDescriptionHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 25));
        }
      }
    } catch (err) {
      console.warn("Failed to load history:", err);
    }

    // Load chat from localStorage
    try {
      const savedChat = safeGet("aiChatConversation");
      if (savedChat) setChatMessages(JSON.parse(savedChat));
    } catch (e) {
      console.warn("Failed to load chat conversation", e);
    }

    // Load last seen timestamp
    try {
      const v = safeGet("aiChatLastSeen");
      if (v) setLastSeen(parseInt(v, 10) || 0);
    } catch (e) {}
  }, []);

  // Save chat messages to localStorage when they change
  useEffect(() => {
    try {
      safeSet("aiChatConversation", JSON.stringify(chatMessages));
    } catch (e) {}
  }, [chatMessages]);

  // Update unread count whenever messages or lastSeen change
  useEffect(() => {
    const unread = chatMessages.filter((m) => m.role === "assistant" && m.ts > (lastSeen || 0)).length;
    setUnreadCount(unread);
  }, [chatMessages, lastSeen]);

  const router = useRouter();

  // Redirect to auth page when not logged in
  // useEffect(() => {
  //   if (!user) {
  //     router.push('/auth');
  //   }
  // }, [user, router]);

  // if (!user) {
  //   // Render nothing while redirecting
  //   return null;
  // }

  // templates feature removed — no client-side template loading

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // template save removed

  const handleImageChange = (e) => {
    const f = e.target?.files?.[0];
    if (!f) return;
    processSelectedFile(f);
  };

  const processSelectedFile = async (f) => {
    if (!f.type || !f.type.startsWith("image/")) {
      alert("Please upload a valid image file (png/jpg/webp).");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      alert("Image is too large. Maximum file size is 3 MB.");
      return;
    }
    try {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    } catch (e) {}
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    // Try to generate a quick caption client-side for a better UX
    try {
      const result = await generateCaptionClientside(f);
      if (result?.caption) {
        setFormData((prev) => ({
          ...prev,
          keyFeatures: result.caption,
          productName: prev.productName || result.title || prev.productName,
          category: prev.category || "Other",
        }));
      }
    } catch (err) {
      // Ignore — captioning is optional
      console.warn("Client-side caption failed:", err);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    processSelectedFile(f);
  };

  const removeImage = () => {
    try {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    } catch (e) {}
    setImageFile(null);
    setImagePreview("");
  };
  const clearChat = () => {
    if (confirm("Clear chat history?")) {
      setChatMessages([]);
      try { safeRemove("aiChatConversation"); } catch (e) {}
      try { safeRemove("aiChatLastSeen"); } catch (e) {}
      setLastSeen(0);
      setUnreadCount(0);
    }
  };

  const sendChatMessage = async (text) => {
    if (!text || chatSending) return;
    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setChatMessages((s) => [...s, userMsg]);
    setChatSending(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined }, body: JSON.stringify({ messages: [...chatMessages, userMsg] }) });
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error || 'Chat failed';
        const assistantMsg = { role: 'assistant', content: `Error: ${err}`, ts: Date.now() };
        setChatMessages((s) => [...s, assistantMsg]);
      } else {
        const assistantMsg = { role: 'assistant', content: data.reply || 'No reply', ts: Date.now(), provider: data.provider };
        setChatMessages((s) => [...s, assistantMsg]);
      }
    } catch (err) {
      const assistantMsg = { role: 'assistant', content: `Error: ${err.message}`, ts: Date.now() };
      setChatMessages((s) => [...s, assistantMsg]);
    } finally {
      setChatSending(false);
    }
  };

  // template apply/delete removed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDescriptions([]);
    setCopiedIndex(null);
    setProviderInfo(null);

    try {
      // Image-only flow
      if (isImageOnly) {
        if (!imageFile) {
          setError("Please upload an image for image-only generation.");
          setLoading(false);
          return;
        }

        // Try client-side captioning first (no API key required)
        let caption = formData.keyFeatures || "";
        try {
          const result = await generateCaptionClientside(imageFile);
          caption = result?.caption || caption;
          // Optionally set a short title based on top label
          if (result?.title && !formData.productName) {
            setFormData((prev) => ({ ...prev, productName: result.title }));
          }
        } catch (err) {
          console.warn("Client caption failed:", err);
        }

        if (!caption || caption.length < 5) {
          setError("Could not generate a caption locally. Enable HF_API_KEY or enter a short description manually.");
          setLoading(false);
          return;
        }

        // Call the text generation endpoint with caption as keyFeatures
        const payload = {
          productName: formData.productName || `(image) ${caption.split(/[.,]/)[0].slice(0, 40)}`,
          category: formData.category || "Other",
          keyFeatures: caption,
          targetAudience: formData.targetAudience || "",
          tone: formData.tone || "Professional",
          variations: formData.variations || 1,
        };

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-image-origin": "1", Authorization: token ? `Bearer ${token}` : undefined },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Image generation failed (text provider path)");
        }

        setDescriptions(data.descriptions || []);
        if (data.provider) setProviderInfo({ provider: data.provider });

        const historyItem = {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          productName: payload.productName,
          category: payload.category,
          tone: payload.tone,
          descriptions: data.descriptions || [],
          provider: data.provider,
          caption: caption,
        };
        const updatedHistory = [historyItem, ...history].slice(0, 25);
        setHistory(updatedHistory);
        try {
          localStorage.setItem("productDescriptionHistory", JSON.stringify(updatedHistory));
        } catch (err) {
          console.warn("Failed to save history:", err);
        }
        setLoading(false);
        return;
      }

      // Text-based flow (existing)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : undefined },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setDescriptions(data.descriptions);
      if (data.provider) {
        setProviderInfo({ provider: data.provider, model: data.model });
      }

      // Save to history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        productName: formData.productName,
        category: formData.category,
        tone: formData.tone,
        descriptions: data.descriptions,
        provider: data.provider,
        model: data.model,
      };
      const updatedHistory = [historyItem, ...history].slice(0, 25);
      setHistory(updatedHistory);
      try {
        localStorage.setItem("productDescriptionHistory", JSON.stringify(updatedHistory));
      } catch (err) {
        console.warn("Failed to save history:", err);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const wordCount = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  };

  const handleGenerateAgain = () => {
    handleSubmit(new Event("submit"));
  };

  const downloadAsText = () => {
    if (descriptions.length === 0) return;

    let content = `PRODUCT DESCRIPTION EXPORT\n`;
    content += `${"=".repeat(50)}\n\n`;
    content += `Product: ${formData.productName}\n`;
    content += `Category: ${formData.category}\n`;
    content += `Tone: ${formData.tone}\n`;
    if (formData.targetAudience) content += `Target Audience: ${formData.targetAudience}\n`;
    content += `Provider: ${providerInfo?.provider || "Unknown"}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    content += `${"=".repeat(50)}\n\n`;

    descriptions.forEach((desc, idx) => {
      content += `VARIATION ${idx + 1}\n`;
      content += `${"-".repeat(30)}\n`;
      content += `${desc}\n\n`;
      content += `Words: ${wordCount(desc)}\n\n`;
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", `${formData.productName.replace(/\s+/g, "-")}_descriptions.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAsCSV = () => {
    if (descriptions.length === 0) return;

    let content = `Product,Category,Tone,Provider,Variation,Description,Words\n`;
    descriptions.forEach((desc, idx) => {
      const escapedDesc = `"${desc.replace(/"/g, '""')}"`;
      content += `${formData.productName},${formData.category},${formData.tone},${
        providerInfo?.provider || "Unknown"
      },${idx + 1},${escapedDesc},${wordCount(desc)}\n`;
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", `${formData.productName.replace(/\s+/g, "-")}_descriptions.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAsShopifyCSV = () => {
    if (descriptions.length === 0) return;

    // Export each variation as a separate product row (A/B test import friendly)
    const rows = [];
    // Header tailored for Shopify minimal import
    rows.push([
      "Handle",
      "Title",
      "Body (HTML)",
      "Vendor",
      "Type",
      "Tags",
      "Published",
      "Option1 Name",
      "Option1 Value",
      "Variant SKU",
      "Variant Inventory Qty",
      "Variant Price",
      "Image Src",
    ]);

    const baseHandle = formData.productName ? formData.productName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() : "product";

    descriptions.forEach((desc, idx) => {
      const handle = `${baseHandle}-v${idx + 1}`;
      const title = `${formData.productName}${descriptions.length > 1 ? ` — Variation ${idx + 1}` : ""}`;
      const body = desc.replace(/\n/g, "\n\n");
      const vendor = "";
      const type = formData.category || "";
      const tags = formData.tone ? `${formData.tone},AI-generated` : "AI-generated";
      const published = "TRUE";
      const option1Name = "Variation";
      const option1Value = `Variation ${idx + 1}`;
      const sku = "";
      const qty = "";
      const price = "";
      const image = "";

      const row = [
        handle,
        title,
        body,
        vendor,
        type,
        tags,
        published,
        option1Name,
        option1Value,
        sku,
        qty,
        price,
        image,
      ].map((c) => {
        if (c == null) return "";
        // Escape double quotes
        const s = String(c).replace(/"/g, '""');
        // Wrap values that contain commas or newlines in quotes
        return /[",\n]/.test(s) ? `"${s}"` : s;
      });

      rows.push(row.join(","));
    });

    const content = rows.join("\n");
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", `${formData.productName.replace(/\s+/g, "-")}_shopify_ab.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadFromHistory = (item) => {
    setFormData({
      productName: item.productName,
      category: item.category,
      tone: item.tone,
      keyFeatures: "",
      targetAudience: "",
      variations: item.descriptions.length,
    });
    setDescriptions(item.descriptions);
    setProviderInfo({ provider: item.provider, model: item.model });
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteFromHistory = (id) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("productDescriptionHistory", JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to update history:", err);
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Clear all history? This cannot be undone.")) {
      setHistory([]);
      try {
        localStorage.removeItem("productDescriptionHistory");
      } catch (err) {
        console.warn("Failed to clear history:", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-950 to-slate-800 text-slate-100">
      {/* Header / Hero */}
      <header className="w-full border-b border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-2xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">AI Product Writer</h1>
              <p className="text-sm text-slate-300 mt-1">Create high-converting product descriptions with AI — fast, clear, and tailored for e-commerce.</p>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <span className="text-sm px-3 py-1 rounded-md bg-white/5 border border-white/8 text-slate-200">Shopify</span>
            <span className="text-sm px-3 py-1 rounded-md bg-white/5 border border-white/8 text-slate-200">Etsy</span>
            <span className="text-sm px-3 py-1 rounded-md bg-white/5 border border-white/8 text-slate-200">Amazon</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="rounded-3xl bg-gradient-to-b from-white/4 to-white/2 backdrop-blur-2xl border border-white/8 p-8 shadow-2xl">
                <h2 className="text-lg font-semibold mb-2 text-white">Product Details</h2>
                <p className="text-sm text-slate-300 mb-6">Enter a few details or upload an image and let the AI write polished product copy for you.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Templates removed per user request */}

                  {/* Product Name */}
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Image Upload</label>
                    <label
                      role="button"
                      tabIndex={0}
                      aria-label="Upload product image (max 3MB)"
                      aria-describedby="image-hint"
                      className={`group block border-2 border-dashed border-white/8 rounded-lg p-3 bg-gradient-to-b from-white/2 to-transparent hover:border-white/20 transition-colors cursor-pointer ${dragActive ? 'ring-2 ring-purple-500/40' : ''}`}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.currentTarget.querySelector('input')?.click();
                        }
                      }}
                    >
                      <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-white/6 flex items-center justify-center text-white">
                          <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V7a2 2 0 012-2h6a2 2 0 012 2v9" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Drag & drop an image, or click to browse</p>
                          <p id="image-hint" className="text-xs text-slate-400">High-contrast photos work best. Max 3 MB recommended.</p>
                        </div>
                        {imagePreview && <img src={imagePreview} alt="preview" className="ml-auto max-w-[96px] max-h-[72px] rounded-md object-cover border border-white/8" />}
                      </div>
                    </label>
                    <div className="mt-3 flex items-center gap-2">
                      <input id="imageOnly" type="checkbox" checked={isImageOnly} onChange={() => setIsImageOnly((v) => !v)} className="w-4 h-4" />
                      <label htmlFor="imageOnly" className="text-sm text-slate-300">Image-only generation</label>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">When enabled, product name, category and key features become optional.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Product Name <span className="text-purple-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleChange}
                      placeholder='e.g., "CloudWalk Ultra Running Shoes"'
                      required={!isImageOnly}
                      disabled={isImageOnly}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Category <span className="text-purple-400">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required={!isImageOnly}
                      disabled={isImageOnly}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                        backgroundSize: "16px",
                      }}
                    >
                      <option value="" className="bg-slate-900">
                        Select a category
                      </option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-slate-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Key Features */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Key Features <span className="text-purple-400">*</span>
                    </label>
                    <textarea
                      name="keyFeatures"
                      value={formData.keyFeatures}
                      onChange={handleChange}
                      placeholder="e.g., lightweight mesh upper, memory foam insole, non-slip rubber sole, breathable, available in 6 colors"
                      required={!isImageOnly}
                      disabled={isImageOnly}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Separate features with commas
                    </p>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleChange}
                      placeholder='e.g., "Active professionals aged 25-40"'
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
                    />
                  </div>

                  {/* Tone and Variations Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Tone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Tone
                      </label>
                      <select
                        name="tone"
                        value={formData.tone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          backgroundSize: "16px",
                        }}
                      >
                        {TONES.map((t) => (
                          <option key={t} value={t} className="bg-slate-900">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variations */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Variations
                      </label>
                      <select
                        name="variations"
                        value={formData.variations}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          backgroundSize: "16px",
                        }}
                      >
                        {VARIATION_OPTIONS.map((v) => (
                          <option key={v} value={v} className="bg-slate-900">
                            {v} {v === 1 ? "variation" : "variations"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" disabled={loading} className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-500 text-white font-semibold hover:scale-[1.01] transform transition-all shadow-2xl flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <Spinner />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14M5 12h14" />
                        </svg>
                        Generate Description
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-700/10 border border-red-700/20 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-300 text-sm font-medium">Generation Failed</p>
                  <p className="text-red-200 text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-400"
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
                </div>
                <p className="mt-4 text-slate-400 text-sm animate-pulse">
                  Crafting your product descriptions...
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && descriptions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">
                      Generated Descriptions
                    </h2>
                    {providerInfo && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {providerInfo.provider}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={downloadAsText}
                      className="text-xs px-3 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4" />
                      </svg>
                      TXT
                    </button>
                    <button
                      onClick={downloadAsCSV}
                      className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV
                    </button>
                    <button
                      onClick={downloadAsShopifyCSV}
                      className="text-xs px-3 py-1.5 rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h2l.4 2M7 7h10l.4 2M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2zM16 11a4 4 0 11-8 0" />
                      </svg>
                      Shopify A/B
                    </button>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs px-3 py-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History ({history.length})
                    </button>
                    <button
                      onClick={handleGenerateAgain}
                      className="text-xs px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* History Panel */}
                {showHistory && history.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-white">Recent Generations</h3>
                      <button
                        onClick={clearAllHistory}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                                {item.productName}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <span className="px-2 py-0.5 rounded bg-white/5">{item.category}</span>
                                <span className="px-2 py-0.5 rounded bg-white/5">{item.tone}</span>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{item.provider}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(item.id);
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showHistory && history.length === 0 && (
                  <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-center">
                    <p className="text-sm text-slate-400">No history yet. Your generated descriptions will appear here.</p>
                  </div>
                )}

                {descriptions.map((desc, index) => (
                  <div key={index} className="rounded-2xl overflow-hidden shadow-2xl p-5 bg-gradient-to-b from-white/3 to-white/6 border border-white/6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">{index+1}</div>
                        <div>
                          <div className="text-sm font-semibold text-white">Variation {index + 1}</div>
                          <div className="text-xs text-slate-300 mt-0.5">{wordCount(desc)} words</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(desc, index)} className="text-xs px-3 py-1.5 rounded-md bg-white/6 hover:bg-white/10 text-slate-200 transition-all">
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 text-slate-100 text-sm leading-relaxed whitespace-pre-line">{desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && descriptions.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-purple-400/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No descriptions yet
                </h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Fill in your product details on the left and click{" "}
                  <span className="text-purple-400">"Generate Description"</span>{" "}
                  to create AI-powered product descriptions.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-purple-400"
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
            Powered by AI — Google Gemini
          </div>
          <p>
            Built for e-commerce sellers everywhere
          </p>
        </div>
      </footer>
      {/* Chat widget */}
      <div className={`fixed right-6 bottom-6 z-50 flex flex-col items-end ${chatOpen ? '' : ''}`}>
          <div className="mb-3 flex items-center gap-2">
          {chatOpen && (
            <button onClick={() => clearChat()} aria-label="Clear chat history" title="Clear chat history" className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-200">Clear</button>
          )}
          <button
            onClick={() => {
              const opening = !chatOpen;
              setChatOpen(opening);
              if (opening) {
                const now = Date.now();
                setLastSeen(now);
                try { localStorage.setItem('aiChatLastSeen', String(now)); } catch (e) {}
                setUnreadCount(0);
              }
            }}
            aria-pressed={chatOpen}
            aria-expanded={chatOpen}
            aria-controls="ai-chat-dialog"
            aria-label={chatOpen ? 'Close chat dialog' : 'Open chat dialog'}
            className="relative px-3 py-2 rounded-full bg-purple-600 shadow-lg text-white flex items-center gap-2"
          >
            {chatOpen ? 'Close Chat' : 'Chat'}
            {!chatOpen && unreadCount > 0 && (
              <span role="status" aria-live="polite" aria-atomic="true" className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">{unreadCount}</span>
            )}
          </button>
        </div>

        {chatOpen && (
          <div id="ai-chat-dialog" role="dialog" aria-modal="false" aria-label="AI Assistant" tabIndex={-1} className="w-[380px] max-w-full rounded-2xl bg-slate-900/95 border border-white/8 shadow-2xl p-3 flex flex-col">
            <div className="text-sm font-medium text-white mb-2">AI Assistant</div>
            <div className="flex-1 overflow-y-auto max-h-64 space-y-2 mb-3" role="log" aria-live="polite">
              {chatMessages.length === 0 && <div className="text-xs text-slate-400">Say hi — the assistant will keep context between messages.</div>}
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`p-2 rounded-md ${m.role === 'user' ? 'bg-white/6 text-white self-end' : 'bg-white/3 text-white/90 self-start'}`}>
                  <div className="text-xs leading-snug whitespace-pre-wrap">{m.content}</div>
                  {m.provider && <div className="text-xxs text-slate-400 mt-1">via {m.provider}</div>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                aria-label="Chat message"
                type="text"
                placeholder={chatSending ? 'Sending...' : 'Ask about product, SEO tips, or marketing copy...'}
                disabled={chatSending}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const v = e.target.value.trim(); if (v) { e.target.value = ''; sendChatMessage(v); } } }}
                className="flex-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none"
              />
              <button aria-label="Send message" onClick={() => { const v = chatInputRef.current?.value?.trim(); if (v) { chatInputRef.current.value = ''; sendChatMessage(v); } }} disabled={chatSending} className="px-3 py-2 rounded-md bg-emerald-500 text-white text-sm">{chatSending ? '...' : 'Send'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Client-side captioning using TensorFlow.js MobileNet
async function generateCaptionClientside(file) {
  // Dynamic import to avoid loading TFJS on server or when not needed
  const tf = await import('@tensorflow/tfjs');
  const mobilenet = await import('@tensorflow-models/mobilenet');
  await tf.ready();

  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.style.maxWidth = '1024px';
    img.style.maxHeight = '1024px';
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const model = await mobilenet.load();
        const predictions = await model.classify(img);
        // predictions: [{className, probability}, ...]
        const labels = predictions.slice(0, 3).map((p) => p.className.split(',')[0].trim());
        const caption = `Photo of ${labels.join(', ')}`;
        const title = labels[0] ? labels[0].split(' ')[0] : '(image)';
        URL.revokeObjectURL(img.src);
        resolve({ caption, labels: predictions, title });
      } catch (err) {
        URL.revokeObjectURL(img.src);
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error('Failed to load image for captioning'));
  });
}
