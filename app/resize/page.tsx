"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import { Crop, Trash2, Download, RefreshCw, ArrowLeft, ShieldCheck, Maximize2, Settings } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface CropBox {
  x: number; // canvas scale
  y: number;
  width: number;
  height: number;
}

export default function ResizePage() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { t } = useLanguage();
  
  // Custom dimensions (pixels)
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  
  // Lock aspect ratio logic
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [aspectRatioValue, setAspectRatioValue] = useState<string>("free");

  // Crop selection coordinates
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop drag coordinate offsets
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const cropStartRef = useRef<CropBox | null>(null);

  const ratioPresets = [
    { label: t.custom, value: "free" },
    { label: "1:1 Square", value: "1:1" },
    { label: "16:9 Landscape", value: "16:9" },
    { label: "9:16 Portrait", value: "9:16" },
    { label: "4:3 Standard", value: "4:3" },
  ];

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Redraw canvas whenever crop coordinates or configs change
  useEffect(() => {
    drawCanvas();
  }, [cropBox]);

  const handleFileSelected = (file: File) => {
    setImage(file);
    setCropBox(null);
    setAspectRatioValue("free");
    setLockAspectRatio(false);
    imgRef.current = null;
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setTargetWidth(img.width);
      setTargetHeight(img.height);

      // Initialize crop selection to fit 80% of original image dimensions
      const cropW = Math.round(img.width * 0.8);
      const cropH = Math.round(img.height * 0.8);
      const cropX = Math.round((img.width - cropW) / 2);
      const cropY = Math.round((img.height - cropH) / 2);
      
      setCropBox({ x: cropX, y: cropY, width: cropW, height: cropH });
    };
    img.src = url;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current || !cropBox) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = imgRef.current.width;
    const h = imgRef.current.height;
    canvas.width = w;
    canvas.height = h;

    // Draw main original image background
    ctx.drawImage(imgRef.current, 0, 0);

    // Apply darkened backdrop mask outside selected crop box boundaries
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    
    // Top strip
    ctx.fillRect(0, 0, w, cropBox.y);
    // Bottom strip
    ctx.fillRect(0, cropBox.y + cropBox.height, w, h - (cropBox.y + cropBox.height));
    // Left strip
    ctx.fillRect(0, cropBox.y, cropBox.x, cropBox.height);
    // Right strip
    ctx.fillRect(cropBox.x + cropBox.width, cropBox.y, w - (cropBox.x + cropBox.width), cropBox.height);

    // Draw selection dashed outline borders
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = Math.max(1.5, w / 400);
    ctx.setLineDash([Math.max(4, w / 150), Math.max(4, w / 150)]);
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    ctx.setLineDash([]); // clear dash formatting

    // Draw corner dragging squares/handles
    ctx.fillStyle = "#6366f1";
    const size = Math.max(8, w / 75);
    
    // Top Left
    ctx.fillRect(cropBox.x - size / 2, cropBox.y - size / 2, size, size);
    // Top Right
    ctx.fillRect(cropBox.x + cropBox.width - size / 2, cropBox.y - size / 2, size, size);
    // Bottom Left
    ctx.fillRect(cropBox.x - size / 2, cropBox.y + cropBox.height - size / 2, size, size);
    // Bottom Right
    ctx.fillRect(cropBox.x + cropBox.width - size / 2, cropBox.y + cropBox.height - size / 2, size, size);
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
    if (!cropBox || !imgRef.current) return;
    
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.max(12, imgRef.current.width / 50); // hitbox size
    
    // Hit collision testing for handles
    const handleCollisions = [
      { name: "tl", x: cropBox.x, y: cropBox.y },
      { name: "tr", x: cropBox.x + cropBox.width, y: cropBox.y },
      { name: "bl", x: cropBox.x, y: cropBox.y + cropBox.height },
      { name: "br", x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height }
    ];

    const hitHandle = handleCollisions.find(
      (h) => Math.abs(coords.x - h.x) <= size && Math.abs(coords.y - h.y) <= size
    );

    if (hitHandle) {
      setActiveHandle(hitHandle.name);
      dragStartRef.current = coords;
      cropStartRef.current = { ...cropBox };
    } else if (
      coords.x >= cropBox.x &&
      coords.x <= cropBox.x + cropBox.width &&
      coords.y >= cropBox.y &&
      coords.y <= cropBox.y + cropBox.height
    ) {
      // Center hit -> drag entire box
      setActiveHandle("drag");
      dragStartRef.current = coords;
      cropStartRef.current = { ...cropBox };
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!activeHandle || !dragStartRef.current || !cropStartRef.current || !cropBox || !imgRef.current) return;

    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const deltaX = coords.x - dragStartRef.current.x;
    const deltaY = coords.y - dragStartRef.current.y;
    const imgW = imgRef.current.width;
    const imgH = imgRef.current.height;

    let nextBox = { ...cropBox };

    if (activeHandle === "drag") {
      nextBox.x = Math.max(0, Math.min(imgW - cropStartRef.current.width, cropStartRef.current.x + deltaX));
      nextBox.y = Math.max(0, Math.min(imgH - cropStartRef.current.height, cropStartRef.current.y + deltaY));
    } else {
      // Resize handles boundaries check
      let newX = cropBox.x;
      let newY = cropBox.y;
      let newW = cropBox.width;
      let newH = cropBox.height;

      // Determine aspect ratio scaling locks
      let aspect: number | null = null;
      if (aspectRatioValue !== "free") {
        const [aW, aH] = aspectRatioValue.split(":").map(Number);
        aspect = aW / aH;
      } else if (lockAspectRatio) {
        aspect = cropStartRef.current.width / cropStartRef.current.height;
      }

      if (activeHandle === "tl") {
        newX = Math.max(0, Math.min(cropStartRef.current.x + cropStartRef.current.width - 20, cropStartRef.current.x + deltaX));
        newW = cropStartRef.current.x + cropStartRef.current.width - newX;
        
        if (aspect) {
          newH = newW / aspect;
          newY = cropStartRef.current.y + cropStartRef.current.height - newH;
          if (newY < 0) {
            newY = 0;
            newH = cropStartRef.current.y + cropStartRef.current.height;
            newW = newH * aspect;
            newX = cropStartRef.current.x + cropStartRef.current.width - newW;
          }
        } else {
          newY = Math.max(0, Math.min(cropStartRef.current.y + cropStartRef.current.height - 20, cropStartRef.current.y + deltaY));
          newH = cropStartRef.current.y + cropStartRef.current.height - newY;
        }
      } else if (activeHandle === "tr") {
        const maxX = cropStartRef.current.x + cropStartRef.current.width;
        newW = Math.max(20, Math.min(imgW - cropStartRef.current.x, cropStartRef.current.width + deltaX));
        
        if (aspect) {
          newH = newW / aspect;
          newY = cropStartRef.current.y + cropStartRef.current.height - newH;
          if (newY < 0) {
            newY = 0;
            newH = cropStartRef.current.y + cropStartRef.current.height;
            newW = newH * aspect;
          }
        } else {
          newY = Math.max(0, Math.min(cropStartRef.current.y + cropStartRef.current.height - 20, cropStartRef.current.y + deltaY));
          newH = cropStartRef.current.y + cropStartRef.current.height - newY;
        }
      } else if (activeHandle === "bl") {
        newX = Math.max(0, Math.min(cropStartRef.current.x + cropStartRef.current.width - 20, cropStartRef.current.x + deltaX));
        newW = cropStartRef.current.x + cropStartRef.current.width - newX;
        
        if (aspect) {
          newH = newW / aspect;
          if (cropStartRef.current.y + newH > imgH) {
            newH = imgH - cropStartRef.current.y;
            newW = newH * aspect;
            newX = cropStartRef.current.x + cropStartRef.current.width - newW;
          }
        } else {
          newH = Math.max(20, Math.min(imgH - cropStartRef.current.y, cropStartRef.current.height + deltaY));
        }
      } else if (activeHandle === "br") {
        newW = Math.max(20, Math.min(imgW - cropStartRef.current.x, cropStartRef.current.width + deltaX));
        if (aspect) {
          newH = newW / aspect;
          if (cropStartRef.current.y + newH > imgH) {
            newH = imgH - cropStartRef.current.y;
            newW = newH * aspect;
          }
        } else {
          newH = Math.max(20, Math.min(imgH - cropStartRef.current.y, cropStartRef.current.height + deltaY));
        }
      }

      nextBox = {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH)
      };
    }

    setCropBox(nextBox);
    setTargetWidth(nextBox.width);
    setTargetHeight(nextBox.height);
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
    dragStartRef.current = null;
    cropStartRef.current = null;
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches && e.touches[0]) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Dimensions inputs handlers
  const handleWidthChange = (wVal: number) => {
    if (!cropBox || !imgRef.current) return;
    const cleanW = Math.max(20, Math.min(imgRef.current.width - cropBox.x, wVal));
    setTargetWidth(cleanW);
    
    if (lockAspectRatio || aspectRatioValue !== "free") {
      let ratio = cropBox.width / cropBox.height;
      if (aspectRatioValue !== "free") {
        const [aW, aH] = aspectRatioValue.split(":").map(Number);
        ratio = aW / aH;
      }
      const cleanH = Math.round(cleanW / ratio);
      if (cropBox.y + cleanH <= imgRef.current.height) {
        setTargetHeight(cleanH);
        setCropBox({ ...cropBox, width: cleanW, height: cleanH });
      }
    } else {
      setCropBox({ ...cropBox, width: cleanW });
    }
  };

  const handleHeightChange = (hVal: number) => {
    if (!cropBox || !imgRef.current) return;
    const cleanH = Math.max(20, Math.min(imgRef.current.height - cropBox.y, hVal));
    setTargetHeight(cleanH);

    if (lockAspectRatio || aspectRatioValue !== "free") {
      let ratio = cropBox.width / cropBox.height;
      if (aspectRatioValue !== "free") {
        const [aW, aH] = aspectRatioValue.split(":").map(Number);
        ratio = aW / aH;
      }
      const cleanW = Math.round(cleanH * ratio);
      if (cropBox.x + cleanW <= imgRef.current.width) {
        setTargetWidth(cleanW);
        setCropBox({ ...cropBox, width: cleanW, height: cleanH });
      }
    } else {
      setCropBox({ ...cropBox, height: cleanH });
    }
  };

  // Select Aspect Ratio preset
  const handleRatioSelect = (val: string) => {
    setAspectRatioValue(val);
    if (!cropBox || !imgRef.current) return;

    if (val === "free") {
      setLockAspectRatio(false);
      return;
    }

    const [aW, aH] = val.split(":").map(Number);
    const targetRatio = aW / aH;

    // Scale crop selection based on targetRatio constraints
    let newW = cropBox.width;
    let newH = newW / targetRatio;

    if (cropBox.y + newH > imgRef.current.height) {
      newH = imgRef.current.height - cropBox.y;
      newW = newH * targetRatio;
    }

    if (cropBox.x + newW > imgRef.current.width) {
      newW = imgRef.current.width - cropBox.x;
      newH = newW / targetRatio;
    }

    const updated = {
      ...cropBox,
      width: Math.round(newW),
      height: Math.round(newH),
    };
    
    setCropBox(updated);
    setTargetWidth(updated.width);
    setTargetHeight(updated.height);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !imgRef.current || !cropBox) return;

    // Draw crop boundaries offscreen and download result
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = cropBox.width;
    exportCanvas.height = cropBox.height;
    
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Slice image section inside cropBox
    ctx.drawImage(
      imgRef.current,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      0,
      0,
      cropBox.width,
      cropBox.height
    );

    const link = document.createElement("a");
    const originalName = image.name.substring(0, image.name.lastIndexOf(".")) || image.name;
    const format = image.type.split("/")[1] || "png";
    
    link.download = `${originalName}-cropped.${format}`;
    link.href = exportCanvas.toDataURL(image.type);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCropBox(null);
    imgRef.current = null;
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
            <Crop className="h-7 w-7 text-indigo-500" />
            {t.cardResizeTitle}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium">
            {t.cardResizeDesc}
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
            {/* Control Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">
              
              {/* Crop Custom Dimension Values */}
              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                  <Maximize2 className="h-4 w-4 text-indigo-500" />
                  {t.resizeSettings}
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">{t.width}</label>
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm text-slate-800 dark:text-white outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">{t.height}</label>
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm text-slate-800 dark:text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {aspectRatioValue === "free" && (
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <input
                      type="checkbox"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      className="rounded border-slate-300 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500/30"
                    />
                    <span>{t.lockAspect}</span>
                  </label>
                )}
              </div>

              {/* Crop Ratio Presets */}
              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  {t.aspectRatio}
                </h2>

                <div className="flex flex-col gap-1.5">
                  {ratioPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleRatioSelect(preset.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        aspectRatioValue === preset.value
                          ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Interactive Workspace Area */}
            <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-2">
              
              {/* Canvas Preview Container */}
              <div className="w-full flex items-center justify-center border border-border rounded-2xl bg-card p-4 md:p-6 overflow-hidden min-h-[400px]">
                <div className="relative max-w-full flex justify-center shadow-md">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handlePointerUp}
                    className="max-w-full max-h-[500px] object-contain rounded-lg border border-border cursor-crosshair checkerboard-bg"
                  />
                </div>
              </div>

              {/* Bottom Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card shadow-sm">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.resetBtn}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!cropBox}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t.cropBtn}
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </>
  );
}
