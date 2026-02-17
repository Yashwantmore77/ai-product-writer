# AI Product Writer

Lightweight Next.js app that generates e-commerce product descriptions using multiple AI providers. Includes a generator UI, image-based captioning (client-side TFJS) and server-side provider fallbacks.

## Quick start

1. Install dependencies

```bash
npm install
```

2. Run development server

```bash
npm run dev
```

3. Open http://localhost:3000 and go to `/generate`.

## Environment variables

The app supports multiple optional provider keys. Set only the providers you want to use.

- `GEMINI_API_KEY` — Google Gemini (optional)
- `GROQ_API_KEY` — Groq (optional)
- `OPENROUTER_API_KEY` — OpenRouter (optional)
- `COHERE_API_KEY` — Cohere (optional)
- `HF_API_KEY` — Hugging Face (optional). Required only for the server-side image caption/text pipeline (`/api/generate/image`).
- `HF_TEXT_MODEL` — (optional) HF text model id to prefer for text generation when HF is used.
- `SENTRY_DSN` — (optional) Sentry DSN for error tracking (dynamically imported).
- `EXPOSE_METRICS` — set to `1` to allow the dev `/api/metrics` endpoint to return in-memory metrics. Do NOT enable in public production environments.

## Notes & features

- Client-side image captioning uses `@tensorflow/tfjs` and `@tensorflow-models/mobilenet` to avoid requiring an API key for basic image-to-text flow.
- Drag-and-drop and file-size validation: max 3 MB recommended.
- Generated output can be exported as TXT, CSV, or Shopify A/B CSV.
- In-memory rate limiting and metrics are for development/demo purposes; use Redis or a durable store for production.

## Development tips

- If you use the server-side image route, set `HF_API_KEY` in your environment.
- To disable exposing metrics, leave `EXPOSE_METRICS` unset.

## License

This project is provided as-is for demonstration and prototyping.

## Deploying to Vercel

1. Install the Vercel CLI (optional) and log in:

```bash
npm i -g vercel
vercel login
```

2. From the project root run:

```bash
vercel --prod
```

3. Set environment variables in the Vercel dashboard for your project (do not commit secrets):

- `GEMINI_API_KEY` (optional)
- `GROQ_API_KEY` (optional)
- `OPENROUTER_API_KEY` (optional)
- `COHERE_API_KEY` (optional)
- `HF_API_KEY` (optional; required for the server-side image pipeline)
- `HF_TEXT_MODEL` (optional)
- `SENTRY_DSN` (optional)
- `EXPOSE_METRICS` (set to `1` for dev metrics; avoid in public production)

Notes:
- Vercel auto-detects Next.js; the included `vercel.json` is minimal and safe to keep. 
- Client-side TFJS models will run in the browser — no server API key required for basic image captioning.
- For production-grade rate limiting or metrics, use external stores (Redis, Datadog, etc.).

If you prefer the Vercel dashboard: create a new project, import this Git repository, then configure Environment Variables in the project Settings before deploying.
