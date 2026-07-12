import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import ToolsCatalog from "@/components/ToolsCatalog";
import { Lock, Award, ShieldCheck, Zap } from "lucide-react";

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

      <main className="flex-1 grid-bg transition-colors">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-6 md:pt-12 md:pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" />
              100% Free & Offline-Native Tools
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl max-w-4xl mx-auto leading-tight">
              Free Online Image Tools & Background Remover
            </h1>

            <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-slate-650 dark:text-slate-400 leading-relaxed font-medium">
              Simple, quick, and secure image utilities. All operations run locally inside your browser. No files are ever uploaded to a server.
            </p>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-12 border-t border-slate-200 dark:border-zinc-800/60 bg-white/40 dark:bg-slate-950/20 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ToolsCatalog />
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-16 border-t border-slate-200 dark:border-zinc-800/60 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-12">
              Why Use MediaDit?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Privacy */}
              <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Absolute Privacy</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  We do not upload your images. Everything is processed locally in memory using WebAssembly and Javascript.
                </p>
              </div>

              {/* No Limits */}
              <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">No Restrictions</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Export high-resolution images with no log-ins, no subscription fees, and no watermarks added to your files.
                </p>
              </div>

              {/* Secure */}
              <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Browser Native Speed</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Our utilities continue to work offline without network delay, resolving all calculations directly inside your browser.
                </p>
              </div>
            </div>
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
