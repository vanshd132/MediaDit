"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent, ChangeEvent } from "react";
import Script from "next/script";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import ToolsCatalog from "@/components/ToolsCatalog";
import { useLanguage } from "@/components/LanguageContext";
import { Sparkles, Type, RefreshCw, Crop, Percent, Download, Trash2, Plus, ShieldCheck, FileImage, Undo, Redo } from "lucide-react";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  fontFamily: string;
}

export default function Home() {
  const { t } = useLanguage();
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"none" | "remove-bg" | "add-text" | "resize" | "compress">("none");

  // Remove BG States
  const [isBgRemoving, setIsBgRemoving] = useState(false);
  const [bgRemovingStep, setBgRemovingStep] = useState("");
  const [bgRemovingPct, setBgRemovingPct] = useState<number | null>(null);
  const [bgType, setBgType] = useState<"transparent" | "color">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");

  // Add Text States
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("Your Text");
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFont, setTextFont] = useState("sans-serif");

  // Resize States
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [originalAspect, setOriginalAspect] = useState<number>(1);

  // Compress & Format States
  const [targetFormat, setTargetFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(90);
  const [hasManuallyChangedFormat, setHasManuallyChangedFormat] = useState(false);

  interface HistoryState {
    imageFile: File | null;
    previewUrl: string | null;
    bgType: "transparent" | "color";
    bgColor: string;
    textOverlays: TextOverlay[];
    targetWidth: number;
    targetHeight: number;
    imageElement: HTMLImageElement | null;
  }

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushStateToHistory = (customState?: Partial<HistoryState>) => {
    const nextImage = customState && "imageFile" in customState ? customState.imageFile! : image;
    const nextPreview = customState && "previewUrl" in customState ? customState.previewUrl! : previewUrl;
    const nextBgType = customState && "bgType" in customState ? customState.bgType! : bgType;
    const nextBgColor = customState && "bgColor" in customState ? customState.bgColor! : bgColor;
    const nextTextOverlays = customState && "textOverlays" in customState ? customState.textOverlays! : [...textOverlays];
    const nextWidth = customState && "targetWidth" in customState ? customState.targetWidth! : targetWidth;
    const nextHeight = customState && "targetHeight" in customState ? customState.targetHeight! : targetHeight;
    const nextImgElement = customState && "imageElement" in customState ? customState.imageElement! : imgRef.current;

    const currentState: HistoryState = {
      imageFile: nextImage,
      previewUrl: nextPreview,
      bgType: nextBgType,
      bgColor: nextBgColor,
      textOverlays: nextTextOverlays,
      targetWidth: nextWidth,
      targetHeight: nextHeight,
      imageElement: nextImgElement,
    };

    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, currentState]);
    setHistoryIndex(nextHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const state = history[prevIndex];

      setImage(state.imageFile);
      setPreviewUrl(state.previewUrl);
      setBgType(state.bgType);
      setBgColor(state.bgColor);
      setTextOverlays(state.textOverlays);
      setTargetWidth(state.targetWidth);
      setTargetHeight(state.targetHeight);
      imgRef.current = state.imageElement;

      drawCanvas();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const state = history[nextIndex];

      setImage(state.imageFile);
      setPreviewUrl(state.previewUrl);
      setBgType(state.bgType);
      setBgColor(state.bgColor);
      setTextOverlays(state.textOverlays);
      setTargetWidth(state.targetWidth);
      setTargetHeight(state.targetHeight);
      imgRef.current = state.imageElement;

      drawCanvas();
    }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeOverlayStartRef = useRef<{ x: number; y: number } | null>(null);

  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    // Force selection outline to hide for accurate blob size calculation
    drawCanvas(true);

    const ext = targetFormat;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressedSize(blob.size);
        }
        // Restore outline box drawing
        drawCanvas(false);
      },
      `image/${ext === "png" ? "png" : ext === "jpeg" ? "jpeg" : "webp"}`,
      ext !== "png" ? quality / 100 : undefined
    );
  }, [image, targetFormat, quality, textOverlays, bgType, bgColor, targetWidth, targetHeight]);

  useEffect(() => {
    if (!hasManuallyChangedFormat) {
      const nextFormat = activeTool === "compress" ? "jpeg" : "png";
      setTargetFormat((prev) => (prev === nextFormat ? prev : nextFormat));
    }
  }, [activeTool, hasManuallyChangedFormat]);

  const fonts = [
    { value: "sans-serif", label: "Sans-Serif (Inter)" },
    { value: "serif", label: "Serif (Georgia)" },
    { value: "monospace", label: "Monospace (Courier)" },
    { value: "Impact", label: "Meme Font (Impact)" },
    { value: "Arial", label: "Arial" },
  ];

  const colors = [
    "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
  ];

  const colorPresets = [
    "#ffffff", "#f8fafc", "#fee2e2", "#dbeafe", "#dcfce7", "#fef9c3", "#f3e8ff", "#e2e8f0"
  ];

  // Clean up Object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Sync active text configuration inputs
  useEffect(() => {
    if (activeTextId) {
      const active = textOverlays.find((t) => t.id === activeTextId);
      if (active) {
        setTextInput(active.text);
        setTextSize(active.size);
        setTextColor(active.color);
        setTextFont(active.fontFamily);
      }
    }
  }, [activeTextId]);

  // Redraw canvas whenever states change
  useEffect(() => {
    drawCanvas();
  }, [image, textOverlays, activeTextId, activeTool, bgType, bgColor, targetWidth, targetHeight, targetFormat]);

  const handleFileSelected = (file: File) => {
    setImage(file);
    setActiveTool("none");
    setBgType("transparent");
    setTextOverlays([]);
    setActiveTextId(null);
    imgRef.current = null;
    setHasManuallyChangedFormat(false);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setTargetWidth(img.width);
      setTargetHeight(img.height);
      setOriginalAspect(img.width / img.height);

      const initialState = {
        imageFile: file,
        previewUrl: url,
        bgType: "transparent" as const,
        bgColor: "#ffffff",
        textOverlays: [],
        targetWidth: img.width,
        targetHeight: img.height,
        imageElement: img,
      };
      setHistory([initialState]);
      setHistoryIndex(0);

      drawCanvas();
    };
    img.src = url;
  };

  const drawCanvas = (hideSelection = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = targetWidth || imgRef.current.width;
    const h = targetHeight || imgRef.current.height;

    canvas.width = w;
    canvas.height = h;

    // Clear background
    if (bgType === "color") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    } else if (targetFormat === "jpeg") {
      // JPEG does not support transparency, so default to solid white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    // Draw main image
    ctx.drawImage(imgRef.current, 0, 0, w, h);

    // Draw text overlays
    textOverlays.forEach((overlay) => {
      ctx.font = `${overlay.size}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Shadow stroke for readability
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;
      ctx.lineWidth = Math.max(2, overlay.size / 15);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.strokeText(overlay.text, overlay.x, overlay.y);

      // Render actual text
      ctx.shadowBlur = 0;
      ctx.fillText(overlay.text, overlay.x, overlay.y);

      // Draw interactive selection outline box
      if (overlay.id === activeTextId && activeTool === "add-text" && !hideSelection) {
        const textWidth = ctx.measureText(overlay.text).width;
        const textHeight = overlay.size;

        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = Math.max(1.5, w / 400);
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          overlay.x - textWidth / 2 - 8,
          overlay.y - textHeight / 2 - 8,
          textWidth + 16,
          textHeight + 16
        );
        ctx.setLineDash([]);
      }
    });

  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    setIsBgRemoving(true);
    setBgRemovingStep("Loading AI libraries...");
    setBgRemovingPct(null);

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      setBgRemovingStep("Downloading model (~50MB) & analyzing...");

      const blob = await removeBackground(image, {
        progress: (key: string, current: number, total: number) => {
          const pct = Math.round((current / total) * 100);
          setBgRemovingPct(pct);
          if (key.includes("fetch")) {
            setBgRemovingStep(`Downloading AI model: ${pct}%`);
          } else if (key.includes("compute") || key.includes("onnx")) {
            setBgRemovingStep(`Processing pixels: ${pct}%`);
          } else {
            setBgRemovingStep(`Running background removal: ${pct}%`);
          }
        },
      });

      const newUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        setOriginalAspect(img.width / img.height);
        setPreviewUrl(newUrl);

        const newState = {
          imageFile: image,
          previewUrl: newUrl,
          bgType: "transparent" as const,
          bgColor: "#ffffff",
          textOverlays: [...textOverlays],
          targetWidth: img.width,
          targetHeight: img.height,
          imageElement: img,
        };
        const nextHistory = history.slice(0, historyIndex + 1);
        setHistory([...nextHistory, newState]);
        setHistoryIndex(nextHistory.length);

        drawCanvas();
      };
      img.src = newUrl;
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during background removal. Make sure WebGL is enabled.");
    } finally {
      setIsBgRemoving(false);
      setBgRemovingStep("");
      setBgRemovingPct(null);
    }
  };

  const handleAddText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: "Double click to edit",
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: Math.round(canvas.height / 12) || 48,
      color: "#ffffff",
      fontFamily: "sans-serif",
    };

    const updated = [...textOverlays, newOverlay];
    setTextOverlays(updated);
    setActiveTextId(newOverlay.id);
    pushStateToHistory({ textOverlays: updated });
  };

  const updateActiveText = (fields: Partial<TextOverlay>) => {
    if (!activeTextId) return;
    setTextOverlays(
      textOverlays.map((t) => (t.id === activeTextId ? { ...t, ...fields } : t))
    );
  };

  const handleDeleteActiveText = () => {
    if (!activeTextId) return;
    const updated = textOverlays.filter((t) => t.id !== activeTextId);
    setTextOverlays(updated);
    setActiveTextId(null);
    pushStateToHistory({ textOverlays: updated });
  };

  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (activeTool !== "add-text") return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let foundId: string | null = null;
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const overlay = textOverlays[i];
      ctx.font = `${overlay.size}px ${overlay.fontFamily}`;
      const textWidth = ctx.measureText(overlay.text).width;
      const textHeight = overlay.size;

      const minX = overlay.x - textWidth / 2 - 10;
      const maxX = overlay.x + textWidth / 2 + 10;
      const minY = overlay.y - textHeight / 2 - 10;
      const maxY = overlay.y + textHeight / 2 + 10;

      if (coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY) {
        foundId = overlay.id;
        dragStartRef.current = coords;
        activeOverlayStartRef.current = { x: overlay.x, y: overlay.y };
        break;
      }
    }

    setActiveTextId(foundId);
    if (foundId) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (activeTool !== "add-text" || !isDraggingRef.current || !activeTextId || !dragStartRef.current || !activeOverlayStartRef.current) return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const dx = coords.x - dragStartRef.current.x;
    const dy = coords.y - dragStartRef.current.y;

    setTextOverlays((prev) =>
      prev.map((t) =>
        t.id === activeTextId
          ? {
            ...t,
            x: Math.round(activeOverlayStartRef.current!.x + dx),
            y: Math.round(activeOverlayStartRef.current!.y + dy),
          }
          : t
      )
    );
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      pushStateToHistory();
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
    activeOverlayStartRef.current = null;
  };

  const handleWidthChange = (val: number) => {
    const clamped = Math.min(val, 4000);
    setTargetWidth(clamped);
    if (lockAspect && originalAspect) {
      setTargetHeight(Math.min(Math.round(clamped / originalAspect), 4000));
    }
  };

  const handleHeightChange = (val: number) => {
    const clamped = Math.min(val, 4000);
    setTargetHeight(clamped);
    if (lockAspect && originalAspect) {
      setTargetWidth(Math.min(Math.round(clamped * originalAspect), 4000));
    }
  };

  const handleResizeBlur = () => {
    pushStateToHistory({ targetWidth, targetHeight });
  };



  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    // Force selection outline to hide!
    drawCanvas(true);

    const ext = targetFormat;
    const originalName = image.name.substring(0, image.name.lastIndexOf(".")) || image.name;

    const link = document.createElement("a");
    link.download = `${originalName}-edited.${ext}`;
    link.href = canvas.toDataURL(`image/${ext === "png" ? "png" : ext === "jpeg" ? "jpeg" : "webp"}`, ext !== "png" ? quality / 100 : undefined);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Restore outline
    drawCanvas(false);
  };

  const handleReset = () => {
    setImage(null);
    setTextOverlays([]);
    setActiveTextId(null);
    setActiveTool("none");
    setBgType("transparent");
    imgRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setHasManuallyChangedFormat(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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

        {!image ? (
          <>
            {/* Compact Hero Section */}
            <section className="relative overflow-hidden pt-10 pb-8 md:pt-14 md:pb-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div className="space-y-3">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-tight">
                    {t.heroTitle}
                  </h1>

                  <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {t.heroSub}
                  </p>
                </div>

                {/* Direct Upload in Hero */}
                <div className="max-w-2xl mx-auto pt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Dropzone
                    onFileSelected={handleFileSelected}
                    label="Upload an image to start editing instantly"
                    description="Drag & drop or click to upload PNG, JPEG, or WEBP"
                  />
                  <div className="text-center pt-1.5">
                    <button
                      onClick={handleTrySample}
                      disabled={isSampleLoading}
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer underline decoration-dotted underline-offset-4 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSampleLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                          Loading sample image...
                        </>
                      ) : (
                        "No image? Try a sample."
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Tools Grid Section */}
            <section className="pb-16 pt-4 transition-colors border-t border-slate-200/40 dark:border-zinc-800/20">
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
          </>
        ) : (
          /* Active Image Home Page Editor Studio */
          <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileImage className="h-4 w-4 text-indigo-500" />
                Active Image Editor
              </h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>{t.privacyBadge}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Interactive Canvas */}
              <div className="lg:col-span-7 flex flex-col gap-4 sticky top-0 lg:relative z-20 bg-background/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none py-3 lg:py-0 border-b lg:border-0 border-slate-200/80 dark:border-zinc-850/80">
                <div className="glass-panel p-2 lg:p-4 rounded-2xl flex flex-col items-center justify-center min-h-[180px] lg:min-h-[400px] bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800/80 overflow-hidden">
                  <div className="relative max-w-full flex justify-center shadow-md border border-slate-200/60 dark:border-zinc-800/50 rounded-xl overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                      onMouseUp={handlePointerUp}
                      onMouseLeave={handlePointerUp}
                      onTouchStart={(e) => e.touches && e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                      onTouchMove={(e) => e.touches && e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                      onTouchEnd={handlePointerUp}
                      className={`max-w-full max-h-[160px] sm:max-h-[280px] lg:max-h-[480px] object-contain rounded-lg ${bgType === "transparent" && targetFormat !== "jpeg" ? "checkerboard-bg" : ""
                        } ${activeTool === "add-text" ? "cursor-move" : "cursor-default"}`}
                    />
                  </div>
                </div>

                {/* File info footer details */}
                <div className="glass-panel p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/50 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mr-2">File</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{image.name}</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mr-2">Dimensions</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{targetWidth} x {targetHeight} px</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mr-2">Size</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatFileSize(image.size)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Settings Sidebar */}
              <div className="lg:col-span-5 flex flex-col gap-6">

                {/* Tool Selector Tab Bar & History Controls */}
                <div className="flex bg-slate-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-850 justify-between items-center overflow-x-auto gap-2">
                  <div className="flex gap-1 shrink-0 border-r border-slate-200 dark:border-zinc-850 pr-2">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Undo"
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Redo"
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-1 justify-between items-center gap-0.5 overflow-x-auto">
                    <button
                      onClick={() => setActiveTool("none")}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold text-center transition-colors cursor-pointer shrink-0 ${activeTool === "none"
                          ? "bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      View
                    </button>
                    <button
                      onClick={() => setActiveTool("remove-bg")}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 ${activeTool === "remove-bg"
                          ? "bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      <Sparkles className="h-3 w-3 shrink-0" />
                      Remove BG
                    </button>
                    <button
                      onClick={() => setActiveTool("add-text")}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold text-center transition-colors cursor-pointer shrink-0 ${activeTool === "add-text"
                          ? "bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      Add Text
                    </button>
                    <button
                      onClick={() => setActiveTool("resize")}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold text-center transition-colors cursor-pointer shrink-0 ${activeTool === "resize"
                          ? "bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-855 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      Resize
                    </button>
                    <button
                      onClick={() => setActiveTool("compress")}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold text-center transition-colors cursor-pointer shrink-0 ${activeTool === "compress"
                          ? "bg-white dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      Reduce Size
                    </button>
                  </div>
                </div>

                {/* Action Sidebar Body Panel */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 min-h-[280px] flex flex-col justify-between">
                  <div>
                    {/* VIEW MODE */}
                    {activeTool === "none" && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Workspace Preview</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Your image is loaded locally inside your browser memory. You can select any tool from the top menu to start editing.
                        </p>
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-xl space-y-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-indigo-300">💡 Tip:</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                            All operations are 100% serverless, private, and offline-ready. Your images never leave your machine!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* REMOVE BG TOOL */}
                    {activeTool === "remove-bg" && (
                      <div className="space-y-5 animate-in fade-in">
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                            Remove Background
                          </h3>
                          <p className="text-xs text-slate-555 dark:text-slate-400 leading-relaxed">
                            Isolate your main subject and remove the background using browser-native local AI.
                          </p>
                        </div>

                        {isBgRemoving ? (
                          <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
                            <p className="text-xs font-semibold text-slate-800 dark:text-white">
                              {bgRemovingStep}
                            </p>
                            {bgRemovingPct !== null && (
                              <div className="w-full bg-slate-100 dark:bg-zinc-850 rounded-full h-1.5 overflow-hidden border border-slate-200/30 dark:border-zinc-800">
                                <div
                                  className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${bgRemovingPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4 pt-2">
                            <button
                              onClick={handleRemoveBackground}
                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer animate-pulse"
                            >
                              <Sparkles className="h-4 w-4" />
                              Run Background Remover
                            </button>

                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Background Type</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setBgType("transparent")}
                                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${bgType === "transparent"
                                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                                      : "bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-transparent text-slate-500 dark:text-slate-400"
                                    }`}
                                >
                                  Transparent
                                </button>
                                <button
                                  onClick={() => setBgType("color")}
                                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${bgType === "color"
                                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                                      : "bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-transparent text-slate-500 dark:text-slate-400"
                                    }`}
                                >
                                  Solid Color
                                </button>
                              </div>
                            </div>

                            {bgType === "color" && (
                              <div className="space-y-2.5 pt-1 animate-in fade-in">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Fill Color</label>
                                <div className="flex flex-wrap gap-2">
                                  {colorPresets.map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => setBgColor(color)}
                                      className={`w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 transition-all hover:scale-110 ${bgColor === color && bgType === "color"
                                          ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-950 scale-105"
                                          : ""
                                        }`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                  <input
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 cursor-pointer overflow-hidden p-0 bg-transparent"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADD TEXT TOOL */}
                    {activeTool === "add-text" && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Type className="h-4.5 w-4.5 text-indigo-500" />
                            Add Text Overlay
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Draw draggable styled text directly on top of your image canvas.
                          </p>
                        </div>

                        <button
                          onClick={handleAddText}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          Add New Text Overlay
                        </button>

                        {activeTextId && (
                          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-4 animate-in fade-in">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Edit Active Text</label>
                              <input
                                type="text"
                                value={textInput}
                                onChange={(e) => {
                                  setTextInput(e.target.value);
                                  updateActiveText({ text: e.target.value });
                                }}
                                className="w-full p-2 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-850 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Font Family</label>
                                <select
                                  value={textFont}
                                  onChange={(e) => {
                                    setTextFont(e.target.value);
                                    updateActiveText({ fontFamily: e.target.value });
                                  }}
                                  className="w-full p-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-850 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  {fonts.map((f) => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Font Size</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    value={textSize}
                                    onChange={(e) => {
                                      const size = parseInt(e.target.value);
                                      setTextSize(size);
                                      updateActiveText({ size });
                                    }}
                                    className="flex-1 h-1 bg-slate-200 dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                                  />
                                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-400 w-8 text-right font-mono">{textSize}px</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Text Color</label>
                              <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => {
                                      setTextColor(c);
                                      updateActiveText({ color: c });
                                    }}
                                    className={`w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 transition-all hover:scale-110 ${textColor === c
                                        ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-950 scale-105"
                                        : ""
                                      }`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={textColor}
                                  onChange={(e) => {
                                    setTextColor(e.target.value);
                                    updateActiveText({ color: e.target.value });
                                  }}
                                  className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 cursor-pointer overflow-hidden p-0 bg-transparent"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleDeleteActiveText}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 border border-rose-500/20 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Text Overlay
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* RESIZE TOOL */}
                    {activeTool === "resize" && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Crop className="h-4.5 w-4.5 text-indigo-500" />
                            Scale & Resize Canvas
                          </h3>
                          <p className="text-xs text-slate-555 dark:text-slate-400 leading-relaxed">
                            Scale your canvas width and height dynamically (Max 4000px).
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Width (Max 4000px)</label>
                            <input
                              type="number"
                              value={targetWidth}
                              max="4000"
                              onBlur={handleResizeBlur}
                              onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-850 rounded-lg text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Height (Max 4000px)</label>
                            <input
                              type="number"
                              value={targetHeight}
                              max="4000"
                              onBlur={handleResizeBlur}
                              onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-850 rounded-lg text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-slate-300 select-none pt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lockAspect}
                            onChange={(e) => setLockAspect(e.target.checked)}
                            className="rounded border-slate-300 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                          />
                          Lock Aspect Ratio ({originalAspect.toFixed(2)})
                        </label>
                      </div>
                    )}
                    {/* COMPRESS & SIZE REDUCTION TOOL */}
                    {activeTool === "compress" && (
                      <div className="space-y-5 animate-in fade-in">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Percent className="h-4.5 w-4.5 text-indigo-500" />
                            Compress Size / Quality
                          </h3>
                          <p className="text-xs text-slate-555 dark:text-slate-400 leading-relaxed">
                            Reduce the file size of your JPEGs or WebPs. Adjust the quality slider below to optimize the file size.
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Quality Adjustment</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{quality}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={quality}
                            onChange={(e) => setQuality(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                          />
                          {targetFormat === "png" && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed font-semibold">
                              ⚠️ Note: PNG format is lossless. Change export format to JPEG or WEBP (below) to see file size savings.
                            </p>
                          )}
                          {targetFormat !== "png" && (
                            <p className="text-[10px] text-slate-550 dark:text-slate-500 leading-relaxed italic">
                              Setting the slider between 70% and 80% typically offers high size reduction with zero visible loss in image quality.
                            </p>
                          )}
                        </div>

                        {/* Size Calculations Display */}
                        <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-850/80 rounded-xl space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Size Comparison</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-500 block">Original Size</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-250">{formatFileSize(image.size)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-500 block">New Size (Est.)</span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-250">
                                {compressedSize ? formatFileSize(compressedSize) : "Calculating..."}
                              </span>
                            </div>
                          </div>

                          {compressedSize && (
                            <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
                              {(() => {
                                const diff = image.size - compressedSize;
                                const pct = Math.round((diff / image.size) * 100);
                                if (pct > 0) {
                                  return (
                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      🎉 Est. file size reduction: {pct}% smaller!
                                    </p>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Bottom Action Buttons with Format Selector */}
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-zinc-800/80 mt-6">
                    {/* Always visible Export Format Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Export Format</label>
                      <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-850 rounded-lg">
                        {["png", "jpeg", "webp"].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => {
                              setTargetFormat(fmt as any);
                              setHasManuallyChangedFormat(true);
                            }}
                            className={`flex-1 py-1 px-2 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${targetFormat === fmt
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                              }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleDownload}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Download className="h-4.5 w-4.5" />
                        Download Image
                      </button>
                      <button
                        onClick={handleReset}
                        className="inline-flex items-center justify-center p-3 bg-slate-100 hover:bg-rose-50 dark:bg-zinc-950 dark:hover:bg-rose-955/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 border border-slate-250 dark:border-zinc-850 rounded-xl text-sm font-bold active:scale-[0.98] transition-all cursor-pointer"
                        title="Reset image"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </section>
        )}

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
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p>© {new Date().getFullYear()} MediaDit Editor. All rights reserved. 100% Free & client-side.</p>
          <div className="flex justify-center gap-4 text-slate-450 dark:text-slate-500 font-medium">
            <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline decoration-dotted underline-offset-4">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
