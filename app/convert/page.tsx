"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import { RefreshCw, Trash2, Download, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ConvertPage() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<"png" | "jpeg" | "webp">("webp");
  const [quality, setQuality] = useState(0.85);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelected = (file: File) => {
    setImage(file);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConvertAndDownload = async () => {
    if (!image) return;

    setIsConverting(true);
    setError(null);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Failed to create canvas context.");
          setIsConverting(false);
          return;
        }

        // Draw source to canvas
        ctx.drawImage(img, 0, 0);

        // Convert canvas image to Blob with specified quality
        const mimeType = `image/${targetFormat}`;
        const qualityParam = targetFormat === "png" ? undefined : quality;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              
              // Trigger download
              const link = document.createElement("a");
              const originalName = image.name.substring(0, image.name.lastIndexOf(".")) || image.name;
              link.download = `${originalName}-converted.${targetFormat}`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Revoke url after a short delay
              setTimeout(() => {
                URL.revokeObjectURL(url);
              }, 150);
            } else {
              setError("Failed to extract converted file bytes.");
            }
            setIsConverting(false);
          },
          mimeType,
          qualityParam
        );
      };

      img.onerror = () => {
        setError("Failed to load source image object.");
        setIsConverting(false);
      };

      img.src = previewUrl!;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred during conversion.");
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <>
      <Header />

      <main className="flex-1 bg-background py-8 md:py-12 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                title="Go back to home"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full w-fit mb-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Convert Format</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                  Convert Image Format
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit self-center md:self-auto">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Offline-Native Privacy</span>
            </div>
          </div>

          {!image ? (
            <div className="max-w-4xl mx-auto">
              <Dropzone onFileSelected={handleFileSelected} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Left Column: Settings Panel */}
              <div className="lg:col-span-2 flex flex-col gap-6 order-2 lg:order-1">
                <div className="border border-border rounded-2xl bg-card p-6 flex flex-col gap-6">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                    Format Settings
                  </h2>

                  {/* Format selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Target Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["png", "jpeg", "webp"] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setTargetFormat(format)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            targetFormat === format
                              ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                              : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-850"
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compression quality (only for JPEG and WEBP) */}
                  {targetFormat !== "png" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Compression Quality
                        </label>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-[9px] text-slate-500 dark:text-slate-550 leading-relaxed italic">
                        Lowering compression quality yields smaller file sizes but reduces image sharpness.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Visual Preview / Workspace */}
              <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-2">
                
                {/* Output Preview */}
                <div className="w-full max-w-5xl flex flex-col items-center justify-center border border-border rounded-2xl bg-card p-4 md:p-6 overflow-hidden min-h-[400px]">
                  <div className="relative max-h-[500px] max-w-full rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl!}
                      alt="Source image preview"
                      className="max-h-[450px] object-contain rounded"
                    />
                  </div>
                </div>

                {/* Error indicator */}
                {error && (
                  <div className="flex items-center gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg max-w-2xl mx-auto text-sm leading-relaxed">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Bottom Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card shadow-sm">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Reset Image
                  </button>

                  <button
                    onClick={handleConvertAndDownload}
                    disabled={isConverting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10 disabled:opacity-50 cursor-pointer"
                  >
                    <Download className={`h-4 w-4 ${isConverting ? "animate-spin" : ""}`} />
                    {isConverting ? "Converting..." : "Convert & Download"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Informational section for search crawlers and users */}
          <section className="mt-20 pt-16 border-t border-slate-200/60 dark:border-zinc-800/40 transition-colors">
            <div className="max-w-4xl mx-auto space-y-10">
              
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                  How does browser-native image conversion work?
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  MediaDit converts image formats entirely client-side, giving you high-speed exports with absolute privacy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    🔒 Secure & Serverless
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    When you convert images from PNG to WebP or JPEG to PNG, your photos are processed inside browser memory. Because we don't upload files to remote servers, your private documents never leave your computer.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    🌈 Format Comparison (WebP, PNG, JPEG)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Choose the target format that fits your needs. Use <strong>PNG</strong> for lossless transparent graphics, <strong>JPEG</strong> for standard photo sharing with custom compression sliders, and <strong>WebP</strong> for highly compressed web assets.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    🎨 Lossless Transparency Layers
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    When converting images that have transparent backgrounds (like graphics or background-removed photos) into target formats, make sure to use <strong>PNG</strong> or <strong>WebP</strong> to preserve the transparent layers. Converting transparent images to JPEG will fill the transparency with a solid white background.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    ⚡ High-Speed Canvas Exports
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Our conversion process uses native HTML5 canvas rasterization. By drawing pixels and converting the canvas context directly inside your GPU, we can instantly export images in under a second.
                  </p>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>
    </>
  );
}
