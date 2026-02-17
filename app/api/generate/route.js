import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  captureException,
  captureMessage,
  metricInc,
  metricProviderSuccess,
  metricProviderFailure,
} from "../../../lib/logger";
import { verifyToken } from "../../../lib/auth";

// Simple in-memory rate limiter (per-IP or per-API-key). This is
// sufficient for local development / single-instance deployments.
// For production, replace with a distributed store (Redis) or gateway.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 6; // allow 6 requests per window
const _rateLimitStore = new Map();

function _now() {
  return Date.now();
}

function checkRateLimit(key) {
  const now = _now();
  const entry = _rateLimitStore.get(key) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.reset) {
    // reset window
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  _rateLimitStore.set(key, entry);

  const allowed = entry.count <= RATE_LIMIT_MAX;
  const retryAfterSec = Math.ceil((entry.reset - now) / 1000);
  return { allowed, remaining: Math.max(0, RATE_LIMIT_MAX - entry.count), retryAfter: retryAfterSec };
}

const VALID_TONES = ["Professional", "Casual", "Luxury", "Playful", "Minimalist"];

// ─── AI Provider Definitions ─────────────────────────────────────────
// Each provider has a name, a check for its API key, and a generate function.
// The system tries them in order — if one fails, it falls back to the next.

const providers = [
  {
    name: "Google Gemini",
    model: "gemini-2.0-flash",
    isConfigured: () => !!process.env.GEMINI_API_KEY,
    generate: async (prompt) => {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  },
  {
    name: "Groq (Llama)",
    model: "llama-3.3-70b-versatile",
    isConfigured: () => !!process.env.GROQ_API_KEY,
    generate: async (prompt) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2048,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API error ${res.status}: ${err}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
  {
    name: "OpenRouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    isConfigured: () => !!process.env.OPENROUTER_API_KEY,
    generate: async (prompt) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AI Product Writer",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2048,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter API error ${res.status}: ${err}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
  {
    name: "Cohere",
    model: "command-r",
    isConfigured: () => !!process.env.COHERE_API_KEY,
    generate: async (prompt) => {
      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "command-r",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Cohere API error ${res.status}: ${err}`);
      }
      const data = await res.json();
      return data.message?.content?.[0]?.text || data.text;
    },
  },
  {
    name: "HuggingFace",
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    isConfigured: () => !!process.env.HF_API_KEY,
    generate: async (prompt) => {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
          },
          body: JSON.stringify({
            model: "mistralai/Mistral-7B-Instruct-v0.3",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
            max_tokens: 2048,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HuggingFace API error ${res.status}: ${err}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
];

// ─── Main POST Handler ───────────────────────────────────────────────

export async function POST(request) {
  try {
    // Authentication: require Bearer token
    try {
      const auth = request.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      const payload = verifyToken(token);
      if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    // Basic request metric
    try { metricInc('requests'); } catch (e) { /* ignore */ }
    const { productName, category, keyFeatures, targetAudience, tone, variations } = body;

    // Rate limiting: prefer API-key (header) if provided, otherwise per-IP
    const apiKeyHeader = request.headers.get("x-api-key")?.trim();
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || request.headers.get("x-client-ip") || "unknown");
    const clientKey = apiKeyHeader ? `apiKey:${apiKeyHeader}` : `ip:${clientIp}`;

    const rl = checkRateLimit(clientKey);
    if (!rl.allowed) {
      try { captureMessage('Rate limit exceeded', 'warn', { clientKey, remaining: rl.remaining }); } catch (_) {}
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter} second(s).` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    // Sanitize + validate inputs
    const sanitized = {
      productName: (productName || "").toString().trim(),
      category: (category || "").toString().trim(),
      keyFeatures: (keyFeatures || "").toString().trim(),
      targetAudience: (targetAudience || "").toString().trim(),
      tone: (tone || "Professional").toString().trim(),
      variations: parseInt(variations ?? 1, 10) || 1,
    };

    if (!sanitized.productName || !sanitized.category || !sanitized.keyFeatures) {
      return NextResponse.json(
        { error: "Please provide at least a product name, category, and key features." },
        { status: 400 }
      );
    }

    if (sanitized.productName.length < 2 || sanitized.productName.length > 200) {
      return NextResponse.json({ error: "Product name must be between 2 and 200 characters." }, { status: 400 });
    }

    if (sanitized.keyFeatures.length < 5 || sanitized.keyFeatures.length > 1000) {
      return NextResponse.json({ error: "Key features should be a short comma-separated list (5-1000 chars)." }, { status: 400 });
    }

    if (!Number.isInteger(sanitized.variations) || sanitized.variations < 1 || sanitized.variations > 3) {
      return NextResponse.json({ error: "Variations must be an integer between 1 and 3." }, { status: 400 });
    }

    if (!VALID_TONES.includes(sanitized.tone)) {
      sanitized.tone = "Professional";
    }

    // Find all configured providers
    const available = providers.filter((p) => p.isConfigured());

    // If this request likely came from the image flow (client sets productName to start with '(image)'
    // or sets the `x-image-origin` header), prefer the HuggingFace provider when available.
    try {
      const headerImage = (request.headers.get("x-image-origin") || "").toString() === "1";
      const isImageRequest = headerImage || (sanitized.productName || "").startsWith("(image)");
      if (isImageRequest) {
        const hfIndex = available.findIndex((p) => p.name === "HuggingFace");
        if (hfIndex > -1) {
          const [hf] = available.splice(hfIndex, 1);
          available.unshift(hf);
        }
      }
    } catch (e) {
      // non-fatal
    }

    if (available.length === 0) {
      return NextResponse.json(
        {
          error:
            "No AI provider is configured. Add at least one API key to your .env.local file. Supported: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, COHERE_API_KEY, HF_API_KEY",
        },
        { status: 500 }
      );
    }

    const prompt = buildPrompt({
      productName: sanitized.productName,
      category: sanitized.category,
      keyFeatures: sanitized.keyFeatures,
      targetAudience: sanitized.targetAudience,
      tone: sanitized.tone,
      variations: sanitized.variations,
    });

    // Try each provider in order — fallback on failure
    const errors = [];

    for (const provider of available) {
      try {
        console.log(`🤖 Trying ${provider.name} (${provider.model})...`);
        const text = await provider.generate(prompt);
        const descriptions = parseVariations(text, sanitized.variations || 1);

        console.log(`✅ ${provider.name} succeeded!`);
        try { metricInc('successes'); metricProviderSuccess(provider.name); } catch (e) {}
        return NextResponse.json({
          descriptions,
          provider: provider.name,
          model: provider.model,
        });
      } catch (err) {
        console.warn(`⚠️ ${provider.name} failed: ${err.message}`);
        try { captureException(err, { provider: provider.name, clientKey }); } catch (e) {}
        try { metricInc('failures'); metricProviderFailure(provider.name); } catch (e) {}
        errors.push({ provider: provider.name, error: err.message });
        // Continue to next provider
      }
    }

    // All providers failed
    const tried = errors.map((e) => e.provider).join(", ");
    return NextResponse.json(
      {
        error: `All AI providers failed (${tried}). Please wait a moment and try again, or check your API keys.`,
        details: errors,
      },
      { status: 503 }
    );
  } catch (error) {
    try { captureException(error, { note: 'Unhandled error in /api/generate' }); } catch (e) {}
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function buildPrompt({ productName, category, keyFeatures, targetAudience, tone, variations }) {
  const toneGuide = {
    Professional: "Use a professional, authoritative, and trustworthy tone. Focus on specifications, quality, and value proposition.",
    Casual: "Use a friendly, conversational, and approachable tone. Write as if talking to a friend who'd love this product.",
    Luxury: "Use an elegant, sophisticated, and exclusive tone. Emphasize premium quality, craftsmanship, and exclusivity.",
    Playful: "Use a fun, energetic, and enthusiastic tone. Include creative language and make the reader excited.",
    Minimalist: "Use a clean, concise, and direct tone. Focus on essentials with short, impactful sentences.",
  };

  return `You are an expert e-commerce copywriter who creates compelling, SEO-friendly product descriptions that drive sales.

Generate exactly ${variations} unique product description variation${variations > 1 ? "s" : ""} for the following product:

**Product Name:** ${productName}
**Category:** ${category}
**Key Features:** ${keyFeatures}
**Target Audience:** ${targetAudience || "General consumers"}
**Tone:** ${tone || "Professional"} — ${toneGuide[tone] || toneGuide["Professional"]}

Requirements for each description:
- Write 100-180 words per description
- Start with an attention-grabbing opening line
- Naturally incorporate key features as benefits
- Include sensory or emotional language that connects with the target audience
- End with a subtle call-to-action
- Use SEO-friendly language without keyword stuffing
- Format with short paragraphs for easy readability
- Each variation must be distinctly different in approach and structure

${variations > 1
      ? `Format your response EXACTLY like this, with each variation clearly separated:

---VARIATION 1---
[First description here]

---VARIATION 2---
[Second description here]
${variations === 3 ? "\n---VARIATION 3---\n[Third description here]" : ""}`
      : `Format your response EXACTLY like this:

---VARIATION 1---
[Description here]`
    }

Do NOT include any other text, headers, notes, or explanations outside the variation markers. Only output the variations in the exact format shown above.`;
}

function parseVariations(text, expectedCount) {
  // Try to split by variation markers
  const variationRegex = /---VARIATION\s*\d+---/gi;
  const parts = text.split(variationRegex).filter((part) => part.trim());

  if (parts.length >= expectedCount) {
    return parts.slice(0, expectedCount).map((part) => part.trim());
  }

  // Fallback: try splitting by --- or numbered headers
  const fallbackParts = text
    .split(/\n---+\n|\n\d+\.\s*\n/)
    .filter((part) => part.trim());

  if (fallbackParts.length >= expectedCount) {
    return fallbackParts.slice(0, expectedCount).map((part) => part.trim());
  }

  // Last fallback: return the whole text as a single variation
  if (expectedCount === 1) {
    // Clean up any remaining markers
    const cleaned = text.replace(variationRegex, "").trim();
    return [cleaned];
  }

  // Try to roughly split evenly
  const cleaned = text.replace(variationRegex, "").trim();
  const sentences = cleaned.split(/(?<=\.)\s+/);
  const perVariation = Math.ceil(sentences.length / expectedCount);
  const results = [];

  for (let i = 0; i < expectedCount; i++) {
    const chunk = sentences
      .slice(i * perVariation, (i + 1) * perVariation)
      .join(" ")
      .trim();
    if (chunk) results.push(chunk);
  }

  return results.length > 0 ? results : [cleaned];
}
