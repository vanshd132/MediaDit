"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import { Download, RefreshCw, ArrowLeft, ShieldCheck, FileSpreadsheet, Percent, Info } from "lucide-react";

export default function CompressPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(70);
  const [outputFormat, setOutputFormat] = useState<"original" | "webp" | "jpeg">("webp");
  
  // Compression results state
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  
  const compressionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Read upload file
  const handleFileAccepted = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Set matching default format selector
    if (file.type === "image/webp") {
      setOutputFormat("webp");
    } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
      setOutputFormat("jpeg");
    } else {
      // Default PNG uploads to WEBP for actual compression size reduction
      setOutputFormat("webp");
    }
  };

  // Perform compression in a canvas
  const performCompression = () => {
    if (!imageFile) return;
    setIsCompressing(true);

    let targetFormat = imageFile.type;
    if (outputFormat === "webp") {
      targetFormat = "image/webp";
    } else if (outputFormat === "jpeg") {
      targetFormat = "image/jpeg";
    }

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsCompressing(false);
        return;
      }

      // Draw full resolution
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const q = quality / 100;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCompressedBlob(blob);
            setCompressedSize(blob.size);
          }
          setIsCompressing(false);
        },
        targetFormat,
        targetFormat === "image/png" ? undefined : q
      );
    };
  };

  // Debounce compression to keep quality slider smooth
  useEffect(() => {
    if (!imageFile) return;

    if (compressionTimeoutRef.current) {
      clearTimeout(compressionTimeoutRef.current);
    }

    setIsCompressing(true);
    compressionTimeoutRef.current = setTimeout(() => {
      performCompression();
    }, 150);

    return () => {
      if (compressionTimeoutRef.current) {
        clearTimeout(compressionTimeoutRef.current);
      }
    };
  }, [quality, outputFormat, imageFile]);

  // Format Helper
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Download Trigger
  const handleDownload = () => {
    if (!compressedBlob || !imageFile) return;

    // Define extension
    let ext = "webp";
    if (outputFormat === "jpeg") ext = "jpg";
    if (outputFormat === "original") {
      ext = imageFile.name.split(".").pop() || "jpg";
    }

    const originalName = imageFile.name.substring(0, imageFile.name.lastIndexOf("."));
    const filename = `${originalName}-compressed.${ext}`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(compressedBlob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setCompressedSize(null);
    setCompressedBlob(null);
    setQuality(70);
  };

  // Savings Calculations
  const hasSavings = imageFile && compressedSize && compressedSize < imageFile.size;
  const savingsPct = imageFile && compressedSize 
    ? Math.round(((imageFile.size - compressedSize) / imageFile.size) * 100)
    : 0;

  const isPngOutput = outputFormat === "original" && imageFile?.type === "image/png";

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
                  <Percent className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Compress Image</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                  Reduce File Size
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit self-center md:self-auto">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Offline-Native Privacy</span>
            </div>
          </div>

          {!imageFile ? (
            <div className="max-w-4xl mx-auto">
              <Dropzone onFileSelected={handleFileAccepted} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Left Column: Image Preview */}
              <div className="lg:col-span-3 flex flex-col justify-between border border-border rounded-2xl bg-card p-6 min-h-[400px]">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-4">
                    Image Preview
                  </h2>
                  <div className="relative max-h-[450px] max-w-full rounded-lg overflow-hidden border border-border flex justify-center bg-slate-50 dark:bg-zinc-950/40 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl!}
                      alt="Source preview"
                      className="max-h-[380px] object-contain rounded shadow-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap justify-between gap-2">
                  <span>Name: {imageFile.name}</span>
                  <span>Dimensions: Full Scale</span>
                </div>
              </div>

              {/* Right Column: Compression Panel */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="border border-border rounded-2xl bg-card p-6 flex flex-col justify-between h-full">
                  <div className="space-y-6">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                      Compression Settings
                    </h2>

                    {/* Format selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Output Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["original", "webp", "jpeg"] as const).map((format) => (
                          <button
                            key={format}
                            onClick={() => setOutputFormat(format)}
                            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              outputFormat === format
                                ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                                : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-850"
                            }`}
                          >
                            {format === "original" ? "Original" : format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Compression slider (disabled for PNG output) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Compression Quality
                        </label>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {isPngOutput ? "Lossless" : `${quality}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        disabled={isPngOutput}
                        className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      {isPngOutput && (
                        <div className="flex gap-1.5 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs leading-relaxed">
                          <Info className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            PNG is a lossless format and does not compress with quality sliders. Convert to <strong>WEBP</strong> or <strong>JPEG</strong> to reduce file size.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comparison Box */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Original</span>
                          <p className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                            {formatSize(imageFile.size)}
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-xl border border-indigo-500/10">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Compressed</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isCompressing ? (
                              <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />
                            ) : (
                              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                                {compressedSize ? formatSize(compressedSize) : "Processing..."}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Compression Savings Progress Bar */}
                      {compressedSize && !isCompressing && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>File Savings Ratio</span>
                            <span className={hasSavings ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                              {hasSavings ? `Saved ${savingsPct}%` : "No Savings"}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                hasSavings ? "bg-emerald-500" : "bg-slate-350 dark:bg-zinc-700"
                              }`}
                              style={{ width: `${hasSavings ? savingsPct : 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call to actions */}
                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-2">
                    <button
                      onClick={handleDownload}
                      disabled={isCompressing || !compressedBlob}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Compressed Image</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Upload Another Image</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Informational section for search crawlers and users */}
          <section className="mt-20 pt-16 border-t border-slate-200/60 dark:border-zinc-800/40 transition-colors">
            <div className="max-w-4xl mx-auto space-y-10">
              
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                  How does browser-native image compression work?
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Unlike conventional size reducers that send your photos to external cloud systems, MediaDit processes files directly inside your browser memory.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    🔒 100% Client-Side Privacy
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    When you drag and drop a file, it is loaded into a local HTML5 canvas. The quality adjustment slider scales the canvas rendering matrix locally, exporting the result to a compressed Blob on your device. Your files never leave your computer.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    ⚡ WebP & JPEG Format Optimization
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    WebP and JPEG are lossy formats, meaning they achieve high compression ratios by discarding visual noise that the human eye cannot detect. Dragging the quality slider to 70%–80% can shrink file sizes by up to 80% with zero visible loss in image sharpness.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    💡 Lossless PNG Notice
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    PNG files use lossless compression, which preserves pixel definitions perfectly but results in larger files. Standard quality sliders cannot compress PNGs. If you upload a PNG, convert it to WebP or JPEG inside the format panel to drastically reduce its size.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    🚀 Faster Page Speeds
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Large photos bloat page load times and trigger mobile bandwidth lag. Compressing images under 500 KB before putting them on websites or emails improves your site's SEO scores, reduces user bounce rates, and lowers loading times.
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
