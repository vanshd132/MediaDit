"use client";

import Script from "next/script";
import Header from "@/components/Header";
import ToolsCatalog from "@/components/ToolsCatalog";
import { useLanguage } from "@/components/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MediaDit Photo Editor",
    "description": t.heroSub,
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
      {/* JSON-LD Structured Metadata Schema for Search Engines */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1 bg-background transition-colors flex flex-col justify-start">
        
        {/* Compact Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-tight">
              {t.heroTitle}
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {t.heroSub}
            </p>
          </div>
        </section>

        {/* Tools Grid Section */}
        <section className="pb-16 pt-4 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ToolsCatalog />
          </div>
        </section>

        {/* Informational Section */}
        <section className="pt-24 pb-20 border-t border-slate-200/60 dark:border-zinc-800/40 transition-colors">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center mb-10">
              {t.whyTitle}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Privacy */}
              <div className="space-y-3 text-left">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {t.why1Title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.why1Desc}
                </p>
              </div>

              {/* Local AI */}
              <div className="space-y-3 text-left">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {t.why2Title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.why2Desc}
                </p>
              </div>

              {/* No Signups */}
              <div className="space-y-3 text-left">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {t.why3Title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.why3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Flat Minimalist Privacy Notice */}
        <section className="pb-12 border-t border-slate-200/60 dark:border-zinc-800/40 pt-8 transition-colors">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold flex items-center justify-center gap-1.5">
              {t.footerNotice}
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
