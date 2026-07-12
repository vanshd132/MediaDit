import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import ToolsCatalog from "@/components/ToolsCatalog";

export const metadata: Metadata = {
  title: "MediaDit | Free Online Image Tools & Background Remover",
  description: "100% Free, serverless client-side image editor. Remove backgrounds with AI, add draggable text, resize, crop, and convert images instantly in your browser with complete privacy.",
  keywords: [
    "Free Online Photo Editor",
    "Remove Background Instantly",
    "Add Text to Image Online",
    "Client-Side Background Remover",
    "Image Converter PNG to WEBP",
    "Crop and Resize Images Free",
    "Offline Photo Editor",
    "No Watermark Background Remover"
  ],
  openGraph: {
    title: "MediaDit | Free Online Image Tools",
    description: "Remove background, add text, crop, resize, and convert images. 100% offline, free, and secure.",
    url: "https://mediadit.vercel.app",
    siteName: "MediaDit",
    type: "website",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MediaDit Photo Editor",
    "description": "100% Free client-side image utility suite. Remove background instantly, add text, crop, resize and convert images directly in your browser. No signups, no uploads to server.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires WebGL for background removal.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1 bg-background transition-colors flex flex-col justify-center">
        
        {/* Compact Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-tight">
              Image editing, simplified.
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Free, browser-native tools to remove backgrounds, write text overlays, crop, resize, and convert images. <strong>No signups, no file uploads, 100% private.</strong>
            </p>
          </div>
        </section>

        {/* Tools Grid Section */}
        <section className="pb-16 pt-4 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ToolsCatalog />
          </div>
        </section>

        {/* Flat Minimalist Privacy Notice */}
        <section className="pb-12 border-t border-slate-200/60 dark:border-zinc-800/40 pt-8 transition-colors">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold flex items-center justify-center gap-1.5">
              <span>🔒</span> All operations run locally inside your browser memory. Your images never leave your device.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#090a0f] py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-7xl px-4">
          <p>© {new Date().getFullYear()} MediaDit Editor. All rights reserved. 100% Free & client-side.</p>
        </div>
      </footer>
    </>
  );
}
