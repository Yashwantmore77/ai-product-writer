import { NextResponse } from "next/server";

// Simple in-memory rate limiter (per-IP). For production use Redis.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 6;
const _rateLimitStore = new Map();
function _now() {
  return Date.now();
}
function checkRateLimit(key) {
  const now = _now();
  const entry = _rateLimitStore.get(key) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  _rateLimitStore.set(key, entry);
  const allowed = entry.count <= RATE_LIMIT_MAX;
  const retryAfterSec = Math.ceil((entry.reset - now) / 1000);
  return { allowed, remaining: Math.max(0, RATE_LIMIT_MAX - entry.count), retryAfter: retryAfterSec };
}

function parseVariations(text, expectedCount) {
  const variationRegex = /---VARIATION\s*\d+---/gi;
  const parts = text.split(variationRegex).filter((p) => p.trim());
  if (parts.length >= expectedCount) return parts.slice(0, expectedCount).map((p) => p.trim());
  const fallbackParts = text.split(/\n---+\n|\n\d+\.\s*\n/).filter((p) => p.trim());
  if (fallbackParts.length >= expectedCount) return fallbackParts.slice(0, expectedCount).map((p) => p.trim());
  if (expectedCount === 1) return [text.replace(variationRegex, "").trim()];
  const cleaned = text.replace(variationRegex, "").trim();
  const sentences = cleaned.split(/(?<=\.)\s+/);
  const perVariation = Math.ceil(sentences.length / expectedCount);
  const results = [];
  for (let i = 0; i < expectedCount; i++) {
    const chunk = sentences.slice(i * perVariation, (i + 1) * perVariation).join(" ").trim();
    if (chunk) results.push(chunk);
  }
  return results.length > 0 ? results : [cleaned];
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    const variations = Math.min(Math.max(parseInt(form.get("variations") || "1", 10) || 1, 1), 3);
    const tone = (form.get("tone") || "Professional").toString();

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || "unknown");
    const clientKey = `ip:${clientIp}`;
    const rl = checkRateLimit(clientKey);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter} second(s).` }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
    }

    if (!file) {
      return NextResponse.json({ error: "No image uploaded (form field 'image')." }, { status: 400 });
    }

    if (!process.env.HF_API_KEY) {
      return NextResponse.json({ error: "HF_API_KEY required for image processing." }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 1) Image captioning via Hugging Face
    const captionRes = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, "Content-Type": "application/octet-stream" },
      body: imageBuffer,
    });

    if (!captionRes.ok) {
      const err = await captionRes.text();
      return NextResponse.json({ error: `Image analysis failed: ${captionRes.status} ${err}` }, { status: 502 });
    }

    const captionData = await captionRes.json();
    const caption = Array.isArray(captionData) ? (captionData[0]?.generated_text || captionData[0]?.caption || "") : (captionData.generated_text || captionData.caption || "");
    if (!caption || caption.length < 5) {
      return NextResponse.json({ error: "Image analysis returned no usable description." }, { status: 502 });
    }

    // 2) Build prompt
    const toneGuide = {
      Professional: "Professional, authoritative.",
      Casual: "Friendly, conversational.",
      Luxury: "Elegant, sophisticated.",
      Playful: "Fun, energetic.",
      Minimalist: "Clean, concise.",
    };

    const prompt = `You are an expert e-commerce copywriter. Based ONLY on the following image description (do NOT invent product names or external keywords), generate exactly ${variations} distinct product description variation${variations>1?"s":""}.

Image description: ${caption}

Tone: ${tone} — ${toneGuide[tone] || toneGuide["Professional"]}

Requirements:
- Each description 100-180 words
- Start with an attention-grabbing opening line
- Emphasize apparent materials/visual features and likely use-cases
- End with a subtle call-to-action
- Format with short paragraphs
Output EXACTLY in this format:

---VARIATION 1---
[description]

---VARIATION 2---
[description]
${variations === 3 ? "\n---VARIATION 3---\n[description]" : ""}`;

    // 3) Text generation via HF
    const hfTextModel = process.env.HF_TEXT_MODEL || "google/flan-t5-large";
    const textRes = await fetch(`https://api-inference.huggingface.co/models/${hfTextModel}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 400, temperature: 0.8 } }),
    });

    if (!textRes.ok) {
      const err = await textRes.text();
      return NextResponse.json({ error: `Text generation failed: ${textRes.status} ${err}` }, { status: 502 });
    }

    const textData = await textRes.json();
    const generated = Array.isArray(textData) ? (textData[0]?.generated_text || textData[0]?.summary || "") : (textData.generated_text || textData[0]?.generated_text || "");
    const finalText = (typeof generated === "string" ? generated : JSON.stringify(generated));

    const descriptions = parseVariations(finalText, variations);
    return NextResponse.json({ descriptions, caption, provider: `huggingface:${hfTextModel}` });
  } catch (err) {
    console.error("Image generate error:", err);
    return NextResponse.json({ error: "Image generation failed." }, { status: 500 });
  }
}
