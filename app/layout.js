import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Product Description Writer",
  description:
    "Generate compelling, SEO-friendly product descriptions for your e-commerce store using AI. Perfect for Shopify, Etsy, and Amazon sellers.",
  keywords: [
    "product description",
    "AI writer",
    "e-commerce",
    "Shopify",
    "Etsy",
    "Amazon",
    "SEO",
    "copywriting",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="fixed left-4 top-4 z-50">
            <Link href="/" className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/6 text-white hover:bg-white/10 border border-white/10 transition-all">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z" />
              </svg>
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
