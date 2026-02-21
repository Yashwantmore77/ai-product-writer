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

// In-memory rate limiter (copied from generate route)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20; // allow more for chat
const _rateLimitStore = new Map();
function _now() { return Date.now(); }
function checkRateLimit(key) {
  const now = _now();
  const entry = _rateLimitStore.get(key) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + RATE_LIMIT_WINDOW_MS; }
  entry.count += 1;
  _rateLimitStore.set(key, entry);
  const allowed = entry.count <= RATE_LIMIT_MAX;
  const retryAfterSec = Math.ceil((entry.reset - now) / 1000);
  return { allowed, remaining: Math.max(0, RATE_LIMIT_MAX - entry.count), retryAfter: retryAfterSec };
}

// Providers (lightweight wrappers similar to generate route). These will be tried in order.
const providers = [
  {
    name: "Google Gemini",
    model: "gemini-2.0-flash",
    isConfigured: () => !!process.env.GEMINI_API_KEY,
    generate: async (messages) => {
      // Simplified: join messages into a single prompt for the generative API
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  },
  {
    name: "Groq (Llama)",
    model: "llama-3.3-70b-versatile",
    isConfigured: () => !!process.env.GROQ_API_KEY,
    generate: async (messages) => {
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.8, max_tokens: 1024 }),
      });
      if (!res.ok) throw new Error(`Groq API error ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
  {
    name: "OpenRouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    isConfigured: () => !!process.env.OPENROUTER_API_KEY,
    generate: async (messages) => {
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
        body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: "user", content: prompt }], temperature: 0.8, max_tokens: 1024 }),
      });
      if (!res.ok) throw new Error(`OpenRouter API error ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    },
  },
  {
    name: "Cohere",
    model: "command-r",
    isConfigured: () => !!process.env.COHERE_API_KEY,
    generate: async (messages) => {
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.COHERE_API_KEY}` },
        body: JSON.stringify({ model: "command-r", messages: [{ role: "user", content: prompt }], temperature: 0.8 }),
      });
      if (!res.ok) throw new Error(`Cohere API error ${res.status}`);
      const data = await res.json();
      return data.message?.content?.[0]?.text || data.text;
    },
  },
  {
    name: "HuggingFace",
    model: process.env.HF_TEXT_MODEL || "mistralai/Mistral-7B-Instruct-v0.3",
    isConfigured: () => !!process.env.HF_API_KEY,
    generate: async (messages) => {
      const modelId = process.env.HF_TEXT_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.HF_API_KEY}` },
        body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: prompt }], temperature: 0.8, max_tokens: 1024 }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HuggingFace API error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || data?.generated_text || JSON.stringify(data);
    },
  },
];

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
    try { metricInc('chat_requests'); } catch (e) {}

    const messages = body.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    // Rate limiting per-IP or api key
    const apiKeyHeader = request.headers.get("x-api-key")?.trim();
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || request.headers.get("x-client-ip") || "unknown");
    const clientKey = apiKeyHeader ? `apiKey:${apiKeyHeader}` : `ip:${clientIp}`;
    const rl = checkRateLimit(clientKey);
    if (!rl.allowed) {
      try { captureMessage('Chat rate limit exceeded', 'warn', { clientKey }); } catch (_) {}
      return NextResponse.json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter} second(s).` }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
    }

    const available = providers.filter(p => p.isConfigured());
    if (available.length === 0) {
      return NextResponse.json({ error: 'No AI provider configured.' }, { status: 500 });
    }

    const errors = [];
    for (const provider of available) {
      try {
        console.log(`Chat: trying ${provider.name}...`);
        const reply = await provider.generate(messages);
        try { metricInc('chat_successes'); metricProviderSuccess(provider.name); } catch (e) {}
        return NextResponse.json({ reply, provider: provider.name, model: provider.model || provider.model });
      } catch (err) {
        console.warn(`Chat provider ${provider.name} failed: ${err.message}`);
        try { captureException(err, { provider: provider.name, clientKey }); } catch (e) {}
        try { metricInc('chat_failures'); metricProviderFailure(provider.name); } catch (e) {}
        errors.push({ provider: provider.name, error: err.message });
        // Continue to next provider
      }
    }

    const tried = errors.map(e => e.provider).join(', ');
    return NextResponse.json({ error: `All chat providers failed (${tried})`, details: errors }, { status: 503 });
  } catch (err) {
    try { captureException(err, { note: 'Unhandled error in /api/chat' }); } catch (e) {}
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
