"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { ShieldCheck, ServerCrash, KeyRound, CheckCircle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <>
      <Header />

      <main className="flex-1 bg-background transition-colors flex flex-col justify-start">
        <section className="relative overflow-hidden py-16 md:py-24">
          {/* Subtle decorative background circles */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
                100% Client-Side Privacy
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                Privacy Policy
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-500 dark:text-slate-400">
                We believe your private photos should remain private. Discover how our serverless client-side architecture keeps your data 100% secure.
              </p>
            </div>

            {/* Privacy Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <ServerCrash className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Zero Server Uploads</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Your images are never sent to a remote server. All editing, rendering, and processing occur entirely inside your browser's local memory stack.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Local AI Models</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Background removal uses native ONNX model weights compiled locally on your system using WebGL. No cloud-based processors are utilized.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Purely Client-Side</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Save outputs directly to your disk instantly. Resetting the app or reloading the tab immediately clears all session files and memory states.
                </p>
              </div>
            </div>

            {/* Detailed sections */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-950/10 space-y-8">
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">1. Image Data Processing</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  When you upload or drag-and-drop a photo into the MediaDit workspace, the file is read using the HTML5 File API and loaded directly into a virtual React canvas element. We do not store, copy, or monitor any of your file names, image content, or visual dimensions.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">2. Cookies & Local Analytics</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  We use cookies or browser localStorage exclusively to retain settings like language translations and dark mode/light mode themes. Basic, anonymous page-view statistics are collected using privacy-compliant third-party systems like Vercel Analytics to measure search rankings, with no personal identification trackers.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">3. Third Party Integrations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  The local background removal utility retrieves machine learning model weights from public high-speed repositories (such as UNPKG). Once downloaded, these assets are cached directly by your browser to speed up subsequent visits.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-zinc-850/80">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Contact & Support</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  For support inquiries, questions, or issues, please check our source code or file an issue on GitHub.
                </p>
              </div>
            </div>

            <div className="text-center pt-12">
              <Link
                href="/"
                className="inline-flex items-center justify-center py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                Return to Editor Tools
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#090a0f] py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p>© {new Date().getFullYear()} MediaDit Editor. All rights reserved. 100% Free & client-side.</p>
          <div className="flex justify-center gap-4 text-slate-450 dark:text-slate-500 font-medium">
            <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-dotted underline-offset-4 font-bold text-slate-800 dark:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
