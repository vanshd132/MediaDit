"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import { Sparkles, Trash2, Download, AlertCircle, RefreshCw, ArrowLeft, ShieldCheck, Eraser, Undo, Eye } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface EraseStroke {
  points: { x: number; y: number }[];
  brushSize: number;
}

export default function RemoveBackgroundPage() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  // Background color states
  const [bgType, setBgType] = useState<"transparent" | "color">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");

  // Eraser drawing states
  const [activeTool, setActiveTool] = useState<"none" | "eraser">("none");
  const [brushSize, setBrushSize] = useState(30);
  const [eraseStrokes, setEraseStrokes] = useState<EraseStroke[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const colorPresets = [
    "#ffffff", "#f8fafc", "#fee2e2", "#dbeafe", "#dcfce7", "#fef9c3", "#f3e8ff", "#e2e8f0"
  ];

  // Clean up Object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [previewUrl, processedUrl]);

  // Redraw canvas whenever drawing states or color configs change
  useEffect(() => {
    drawCanvas();
  }, [processedUrl, bgType, bgColor, eraseStrokes, activeTool, brushSize]);

  const handleFileSelected = (file: File) => {
    setError(null);
    setImage(file);
    setProcessedUrl(null);
    setEraseStrokes([]);
    setActiveTool("none");
    setBgType("transparent");
    imgRef.current = null;
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    setIsLoading(true);
    setError(null);
    setLoadingStep("Loading AI libraries...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      
      setLoadingStep("Downloading model (first-time only) & analyzing...");

      const blob = await removeBackground(image, {
        progress: (key: string, current: number, total: number) => {
          const pct = Math.round((current / total) * 100);
          if (key.includes("fetch")) {
            setLoadingStep(`Downloading AI model: ${pct}%`);
          } else if (key.includes("compute") || key.includes("onnx")) {
            setLoadingStep(`Processing pixels: ${pct}%`);
          } else {
            setLoadingStep(`Running background removal: ${pct}%`);
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);

      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setEraseStrokes([]);
        setBgType("transparent");
        drawCanvas();
      };
      img.src = url;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred during background removal. Please make sure WebGL is enabled in your browser.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = imgRef.current.width;
    const h = imgRef.current.height;
    canvas.width = w;
    canvas.height = h;

    // Calculate canvas scale factor (drawing buffer size vs display container client size)
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width ? w / rect.width : 1;

    // 1. Draw cutout image and apply eraser onto an offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const oCtx = offscreen.getContext("2d");
    if (!oCtx) return;

    oCtx.drawImage(imgRef.current, 0, 0);

    // Apply destination-out composite to erase pixels
    oCtx.globalCompositeOperation = "destination-out";
    oCtx.strokeStyle = "rgba(0,0,0,1)";
    oCtx.lineCap = "round";
    oCtx.lineJoin = "round";

    // Draw past strokes (scaled to matching canvas coordinates)
    eraseStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      oCtx.lineWidth = stroke.brushSize * scale;
      oCtx.beginPath();
      oCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        oCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      oCtx.stroke();
    });

    // Draw active stroke in progress
    if (isDrawingRef.current && currentStrokeRef.current.length > 0) {
      oCtx.lineWidth = brushSize * scale;
      oCtx.beginPath();
      oCtx.moveTo(currentStrokeRef.current[0].x, currentStrokeRef.current[0].y);
      for (let i = 1; i < currentStrokeRef.current.length; i++) {
        oCtx.lineTo(currentStrokeRef.current[i].x, currentStrokeRef.current[i].y);
      }
      oCtx.stroke();
    }

    // 2. Clear main canvas and draw outputs
    ctx.clearRect(0, 0, w, h);
    
    // Draw background color if filled
    if (bgType === "color") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    // Overlay offscreen cutout
    ctx.drawImage(offscreen, 0, 0);

    // 3. Draw hover brush cursor circle (Only for editor display, not downloaded exports)
    if (activeTool === "eraser" && mousePosRef.current) {
      const radius = (brushSize * scale) / 2;

      // Outer White Circle
      ctx.beginPath();
      ctx.arc(mousePosRef.current.x, mousePosRef.current.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(1.5, scale * 1.5);
      ctx.stroke();

      // Inner Black Circle
      ctx.beginPath();
      ctx.arc(mousePosRef.current.x, mousePosRef.current.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = Math.max(0.75, scale * 0.75);
      ctx.stroke();
    }
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
    if (activeTool !== "eraser") return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    isDrawingRef.current = true;
    currentStrokeRef.current = [coords];
    drawCanvas();
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (activeTool !== "eraser") return;
    
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    mousePosRef.current = coords;

    if (isDrawingRef.current) {
      currentStrokeRef.current.push(coords);
    }
    
    drawCanvas();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length > 0) {
      const completedPoints = [...currentStrokeRef.current];
      setEraseStrokes((prev) => [
        ...prev,
        { points: completedPoints, brushSize }
      ]);
    }
    currentStrokeRef.current = [];
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  const handleMouseMoveWithHover = (e: MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e: MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "eraser") return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    mousePosRef.current = coords;
    drawCanvas();
  };

  const handleMouseLeave = () => {
    mousePosRef.current = null;
    handlePointerUp();
    drawCanvas();
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === "eraser") {
      e.preventDefault();
      if (e.touches && e.touches[0]) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === "eraser") {
      e.preventDefault();
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };

  const handleUndo = () => {
    if (eraseStrokes.length > 0) {
      setEraseStrokes(eraseStrokes.slice(0, -1));
    }
  };

  const handleClearEraser = () => {
    setEraseStrokes([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    
    // Temporarily hide hover brush cursor for export
    mousePosRef.current = null;
    drawCanvas();

    const link = document.createElement("a");
    const ext = bgType === "color" ? "jpeg" : "png";
    const originalName = image.name.substring(0, image.name.lastIndexOf(".")) || image.name;
    
    link.download = `${originalName}-edited.${ext}`;
    link.href = canvas.toDataURL(`image/${ext === "png" ? "png" : "jpeg"}`, ext === "jpeg" ? 0.92 : undefined);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImage(null);
    setEraseStrokes([]);
    setActiveTool("none");
    setBgType("transparent");
    imgRef.current = null;
    mousePosRef.current = null;
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setPreviewUrl(null);
    setProcessedUrl(null);
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
            {t.allTools}
          </Link>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{t.privacyBadge}</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="h-7 w-7 text-indigo-500" />
            {t.cardRemoveBgTitle}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium">
            {t.cardRemoveBgDesc}
          </p>
        </div>

        {/* Workspace Layout */}
        {!image ? (
          <div className="glass-panel rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col items-center justify-center transition-colors">
            <Dropzone
              onFileSelected={handleFileSelected}
              label={t.dropzoneTitle}
              description={t.dropzoneDesc}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Control Sidebar (Visible once background removed) */}
            {processedUrl && !isLoading && (
              <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1 animate-in fade-in duration-300">
                
                {/* Background Styling Section */}
                <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    Background
                  </h2>

                  {/* Mode togglers */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBgType("transparent")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        bgType === "transparent"
                          ? "bg-indigo-600/10 border-indigo-500/35 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Transparent
                    </button>
                    <button
                      onClick={() => setBgType("color")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        bgType === "color"
                          ? "bg-indigo-600/10 border-indigo-500/35 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Solid Color
                    </button>
                  </div>

                  {/* Preset Colors Grid */}
                  {bgType === "color" && (
                    <div className="space-y-3 animate-in fade-in">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Fill Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setBgColor(color)}
                            className={`w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 transition-all hover:scale-110 active:scale-95 ${
                              bgColor === color && bgType === "color"
                                ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-zinc-950 scale-105"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        {/* Custom color picker */}
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

                {/* Eraser Tool Customizer */}
                <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
                    <Eraser className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    Touch Up Cutout
                  </h2>

                  <button
                    onClick={() => setActiveTool(activeTool === "eraser" ? "none" : "eraser")}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      activeTool === "eraser"
                        ? "bg-rose-500/10 border-rose-500/35 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Eraser className="h-4 w-4" />
                    {activeTool === "eraser" ? "Disable Eraser Tool" : "Enable Eraser Tool"}
                  </button>

                  {activeTool === "eraser" && (
                    <div className="space-y-4 pt-1 animate-in fade-in">
                      {/* Brush size slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Brush Size</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{brushSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="150"
                          value={brushSize}
                          onChange={(e) => setBrushSize(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      {/* Undo / Clear operations */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={handleUndo}
                          disabled={eraseStrokes.length === 0}
                          className="inline-flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          <Undo className="h-3.5 w-3.5" />
                          Undo
                        </button>
                        <button
                          onClick={handleClearEraser}
                          disabled={eraseStrokes.length === 0}
                          className="inline-flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTool === "eraser" && (
                    <p className="text-[10px] text-slate-550 dark:text-slate-500 leading-relaxed italic text-center">
                      Drag on the image above to brush away pixels. Use Undo to step back.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Canvas / Main Preview Area */}
            <div className={`flex flex-col gap-6 order-1 lg:order-2 ${
              processedUrl && !isLoading ? "lg:col-span-3" : "lg:col-span-4"
            }`}>
              
              {/* Output Preview */}
              <div className="w-full max-w-5xl flex flex-col items-center justify-center border border-border rounded-2xl bg-card p-4 md:p-6 overflow-hidden min-h-[400px]">
                {!processedUrl ? (
                  // Initial upload state
                  <div className="relative max-h-[500px] max-w-full rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl!}
                      alt="Source preview"
                      className="max-h-[450px] object-contain rounded"
                    />
                  </div>
                ) : (
                  // Renders canvas with either transparency grid or fill color
                  <div className="relative max-w-full flex justify-center shadow-md">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMoveWithHover}
                      onMouseUp={handlePointerUp}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handlePointerUp}
                      className={`max-w-full max-h-[480px] object-contain rounded-lg border border-border ${
                        bgType === "transparent" ? "checkerboard-bg" : ""
                      } ${activeTool === "eraser" ? "cursor-none" : "cursor-default"}`}
                    />
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              {isLoading && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {loadingStep.includes("Loading AI Model") || loadingStep.includes("Downloading AI Model") || loadingStep.includes("loading")
                      ? t.loadingModel
                      : t.processing}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    {t.firstRunNotice}
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg max-w-2xl mx-auto text-sm leading-relaxed">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Toolbar Actions */}
              {!isLoading && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card shadow-sm">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.resetBtn}
                  </button>

                  {processedUrl ? (
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      {t.downloadBgRemoved} ({bgType === "color" ? "JPEG" : "PNG"})
                    </button>
                  ) : (
                    <button
                      onClick={handleRemoveBackground}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t.removeBgBtn}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </>
  );
}
