"use client";

import Link from "next/link";
import Header from "@/components/Header";
import ImageTextEditor from "@/components/ImageTextEditor";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowLeft, ShieldCheck, TextCursorInput } from "lucide-react";

const faqs = [
  {
    q: "How can it edit text that is part of the image?",
    a: "The tool runs OCR on your image entirely in your browser to find every line of typed text and exactly where it sits. When you change a line, the pixels of the old text are removed and the background behind them is reconstructed from the surrounding pixels, then your new text is drawn back on using a typeface matched to the original.",
  },
  {
    q: "Will it look edited?",
    a: "That is the whole point of the matching step. The font family, weight, italic, pixel size, letter width and colour are all measured from the original text, and the replacement is aligned to the very same baseline. On solid or smoothly shaded backgrounds the result is usually indistinguishable.",
  },
  {
    q: "Which fonts are supported?",
    a: "Standard typed fonts — Arial, Helvetica, San Francisco, Times New Roman, Calibri, Cambria, Courier New, Roboto, Open Sans and other common UI and document typefaces. Handwriting, heavily stylised logos and decorative lettering are not supported yet.",
  },
  {
    q: "Is my image uploaded anywhere?",
    a: "No. The OCR engine, the font matching and the rendering all run inside your browser tab. Your image never leaves your device.",
  },
  {
    q: "Why does it say no editable text was found?",
    a: "The text may be too small, too low-contrast, rotated, or it may be handwriting. Try a sharper or larger version of the image — the tool needs the letters to be legible in the actual pixels.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function EditTextPage() {
  const { t } = useLanguage();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-colors">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.allTools}
          </Link>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{t.privacyBadge}</span>
          </div>
        </div>

        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
            <TextCursorInput className="h-7 w-7 text-indigo-500" />
            Edit Text in an Image
            <span className="text-[10px] align-top bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/20">
              BETA
            </span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium">
            Change the words that are already baked into a photo or screenshot.
            The background behind the old text is rebuilt and the new text is
            drawn in a matched font — so the picture doesn&apos;t look edited.
          </p>
        </div>

        <ImageTextEditor />

        <section className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="rounded-xl p-5 group bg-card border border-border"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-slate-800 dark:text-white text-sm">
                  {f.q}
                  <span className="ml-4 text-indigo-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
