import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DescribeAI - AI Product Description Generator",
  description:
    "Generate compelling, AI-powered product descriptions for Amazon, eBay, and Shopify. Perfect for online sellers looking to save time and increase conversions.",
  keywords: [
    "product description",
    "AI writer",
    "e-commerce",
    "Shopify",
    "Amazon",
    "eBay",
    "SEO",
    "copywriting",
    "description generator",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
