"use client";
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-b from-transparent to-white/2 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-xl">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" /></svg>
            </div>
            <div>
              <div className="text-lg font-semibold">AI Product Writer</div>
              <div className="text-xs text-slate-400">E-commerce copy in seconds</div>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/generate" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium shadow">Generate</Link>
            <a href="/api/metrics" className="text-sm text-slate-400 hover:underline">Dev Metrics</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-12 gap-12 items-center">
        <section className="lg:col-span-7">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Write product descriptions that actually sell — in seconds.</h1>
          <p className="mt-4 text-slate-300 max-w-2xl">AI Product Writer creates polished, platform-ready product descriptions tailored for Shopify, Etsy, Amazon, and more. Upload product photos or let the AI adapt to your tone.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/generate" className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-500 text-white font-semibold shadow-lg">Get Started</Link>
            <button onClick={() => window.location.href = '/generate'} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-white text-sm">View Features</button>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/3 border border-white/6">
              <h3 className="font-semibold">Speed</h3>
              <p className="text-sm text-slate-300 mt-1">Generate polished descriptions quickly for faster product launches.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/6">
              <h3 className="font-semibold">Image-based</h3>
              <p className="text-sm text-slate-300 mt-1">Upload a photo and get targeted descriptions without typing.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/6">
              <h3 className="font-semibold">Export Ready</h3>
              <p className="text-sm text-slate-300 mt-1">Download as TXT, CSV, or Shopify A/B CSV for uploads.</p>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl bg-gradient-to-b from-white/4 to-white/2 p-6 border border-white/8 shadow-2xl">
            <h3 className="text-lg font-semibold">Quick Demo</h3>
            <p className="text-sm text-slate-300 mt-2">Try a quick example or jump to the form to generate your first description.</p>
            <div className="mt-4">
              <img src="/generate-screenshot.png" alt="demo" className="w-full rounded-md border border-white/6 object-cover" />
            </div>
            <div className="mt-4 flex gap-2">
              <Link href="/generate" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm text-center">Open Generator</Link>
              <a href="#features" className="px-4 py-2 rounded-lg bg-white/5 text-white text-sm">Learn more</a>
            </div>
          </div>
          <div className="mt-6 text-xs text-slate-400">Built for sellers — optimized for conversions.</div>
        </aside>
      </main>

      <footer className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-400 text-sm">© {new Date().getFullYear()} AI Product Writer — Designed for e-commerce creators</div>
      </footer>
    </div>
  )
}

