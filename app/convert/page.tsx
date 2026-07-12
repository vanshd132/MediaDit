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
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [previewUrl, convertedUrl]);

  const handleFileSelected = (file: File) => {
    setImage(file);
    setConvertedUrl(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConvert = async () => {
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

        // Convert canvas image to data URL with quality factor (for JPEG/WEBP)
        const mimeType = `image/${targetFormat}`;
        const qualityParam = targetFormat === "png" ? undefined : quality;
        
        const dataUrl = canvas.toDataURL(mimeType, qualityParam);
        
        // Convert data URL back into a Blob
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setIsConverting(false);
          })
          .catch((err) => {
            console.error(err);
            setError("Failed to extract converted file bytes.");
            setIsConverting(false);
          });
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

  const handleDownload = () => {
    if (!convertedUrl || !image) return;

    const link = document.createElement("a");
    const originalName = image.name.substring(0, image.name.lastIndexOf(".")) || image.name;
    link.download = `${originalName}-converted.${targetFormat}`;
    link.href = convertedUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setPreviewUrl(null);
    setConvertedUrl(null);
    setError(null);
  };

  return (
    <>
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-colors">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Runs locally, offline-safe</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
            <RefreshCw className="h-7 w-7 text-indigo-500" />
            Convert Image Format
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium">
            Convert image extensions instantly to WebP, PNG, or JPEG. Adjust output quality sliders for lossy compression benefits.
          </p>
        </div>

        {/* Workspace Layout */}
        {!image ? (
          <div className="glass-panel rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col items-center justify-center transition-colors">
            <Dropzone
              onFileSelected={handleFileSelected}
              label="Drag & drop image to convert formats"
              description="Supports PNG, JPEG, WEBP, BMP up to 15MB"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Control Panel Settings */}
            <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">
              <div className="glass-panel p-5 rounded-2xl border border-border space-y-5">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                  Conversion Settings
                </h2>

                {/* Target format selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Format</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 p-1 rounded-lg">
                    {(["webp", "jpeg", "png"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => {
                          setTargetFormat(fmt);
                          setConvertedUrl(null);
                        }}
                        className={`py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                          targetFormat === fmt
                            ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality slider (lossy compression) */}
                {targetFormat !== "png" && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Compression Quality</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => {
                        setQuality(parseFloat(e.target.value));
                        setConvertedUrl(null);
                      }}
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[9px] text-slate-500 dark:text-slate-550 leading-relaxed italic">
                      Lowering compression quality yields smaller file sizes but reduces image sharpness.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Preview / Workspace */}
            <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-2">
              
              {/* Output Preview */}
              <div className="w-full max-w-5xl flex flex-col items-center justify-center border border-border rounded-2xl bg-card p-4 md:p-6 overflow-hidden min-h-[400px]">
                <div className="relative max-h-[500px] max-w-full rounded-lg overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={convertedUrl || previewUrl!}
                    alt="Conversion target preview"
                    className="max-h-[450px] object-contain rounded"
                  />
                  {convertedUrl && (
                    <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Converted Preview
                    </div>
                  )}
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                  Reset Image
                </button>

                {convertedUrl ? (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </button>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isConverting ? "animate-spin" : ""}`} />
                    {isConverting ? "Converting..." : "Convert Image"}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </>
  );
}
