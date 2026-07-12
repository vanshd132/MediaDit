"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent, ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import { Type, Trash2, Download, Plus, ArrowLeft, ShieldCheck, AlignLeft, Settings } from "lucide-react";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  fontFamily: string;
}

export default function AddTextPage() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg">("png");

  // Inline editing states
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingInputValue, setEditingInputValue] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Form states for the selected active text
  const [activeContent, setActiveContent] = useState("");
  const [activeSize, setActiveSize] = useState(48);
  const [activeColor, setActiveColor] = useState("#ffffff");
  const [activeFont, setActiveFont] = useState("sans-serif");

  const fonts = [
    { value: "sans-serif", label: "Sans-Serif (Inter)" },
    { value: "serif", label: "Serif (Georgia)" },
    { value: "monospace", label: "Monospace (Courier)" },
    { value: "Impact", label: "Meme Font (Impact)" },
    { value: "Arial", label: "Arial" },
    { value: "Comic Sans MS", label: "Comic Sans" },
  ];

  const colors = [
    "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308", 
    "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
  ];

  // Clean up Object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Sync inputs with active text overlay changes
  useEffect(() => {
    if (activeTextId) {
      const active = textOverlays.find((t) => t.id === activeTextId);
      if (active) {
        setActiveContent(active.text);
        setActiveSize(active.size);
        setActiveColor(active.color);
        setActiveFont(active.fontFamily);
      }
    } else {
      setActiveContent("");
    }
  }, [activeTextId, textOverlays]);

  // Redraw canvas on state changes
  useEffect(() => {
    redrawCanvas();
  }, [textOverlays, activeTextId]);

  // Focus inline input when active
  useEffect(() => {
    if (editingTextId) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [editingTextId]);

  const handleFileSelected = (file: File) => {
    setImage(file);
    setTextOverlays([]);
    setActiveTextId(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        redrawCanvas();
      }
    };
    img.src = url;
  };

  const redrawCanvas = (hideSelection = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw background image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0);

    // Draw text overlays
    textOverlays.forEach((overlay) => {
      ctx.font = `${overlay.size}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Readability Text Stroke
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;
      ctx.lineWidth = Math.max(2, overlay.size / 15);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.strokeText(overlay.text, overlay.x, overlay.y);

      // Render actual fill text
      ctx.shadowBlur = 0;
      ctx.fillText(overlay.text, overlay.x, overlay.y);

      // Render interactive selection box around active text
      if (overlay.id === activeTextId && !hideSelection) {
        const width = ctx.measureText(overlay.text).width;
        const height = overlay.size;

        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = Math.max(1.5, overlay.size / 30);
        ctx.strokeRect(
          overlay.x - width / 2 - 8,
          overlay.y - height / 2 - 8,
          width + 16,
          height + 16
        );

        // Render interactive handle dots
        ctx.fillStyle = "#6366f1";
        const handleSize = Math.max(6, overlay.size / 10);
        ctx.fillRect(overlay.x - width / 2 - 8 - handleSize / 2, overlay.y - height / 2 - 8 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(overlay.x + width / 2 + 8 - handleSize / 2, overlay.y - height / 2 - 8 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(overlay.x - width / 2 - 8 - handleSize / 2, overlay.y + height / 2 + 8 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(overlay.x + width / 2 + 8 - handleSize / 2, overlay.y + height / 2 + 8 - handleSize / 2, handleSize, handleSize);
      }
    });
  };

  const addTextOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const baseSize = Math.round(canvas.height / 15) || 48;
    const newText: TextOverlay = {
      id: Date.now().toString(),
      text: "Double Click to Edit",
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: baseSize,
      color: "#ffffff",
      fontFamily: "sans-serif",
    };

    setTextOverlays([...textOverlays, newText]);
    setActiveTextId(newText.id);
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
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Search text item that was clicked (topmost text first by searching in reverse)
    const clickedItem = [...textOverlays].reverse().find((t) => {
      ctx.font = `${t.size}px ${t.fontFamily}`;
      const width = ctx.measureText(t.text).width;
      const height = t.size;

      const xMin = t.x - width / 2 - 10;
      const xMax = t.x + width / 2 + 10;
      const yMin = t.y - height / 2 - 10;
      const yMax = t.y + height / 2 + 10;

      return coords.x >= xMin && coords.x <= xMax && coords.y >= yMin && coords.y <= yMax;
    });

    if (clickedItem) {
      setActiveTextId(clickedItem.id);
      isDraggingRef.current = true;
    } else {
      setActiveTextId(null);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !activeTextId) return;

    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    setTextOverlays(
      textOverlays.map((t) => (t.id === activeTextId ? { ...t, x: coords.x, y: coords.y } : t))
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Find the text item that was double-clicked
    const clickedItem = [...textOverlays].reverse().find((t) => {
      ctx.font = `${t.size}px ${t.fontFamily}`;
      const width = ctx.measureText(t.text).width;
      const height = t.size;

      const xMin = t.x - width / 2 - 10;
      const xMax = t.x + width / 2 + 10;
      const yMin = t.y - height / 2 - 10;
      const yMax = t.y + height / 2 + 10;

      return coords.x >= xMin && coords.x <= xMax && coords.y >= yMin && coords.y <= yMax;
    });

    if (clickedItem) {
      setEditingTextId(clickedItem.id);
      setEditingInputValue(clickedItem.text);
      setActiveTextId(clickedItem.id);
    }
  };

  const handleInlineInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingInputValue(val);
    updateActiveText({ text: val });
  };

  const handleInlineInputBlur = () => {
    if (editingInputValue.trim() === "") {
      updateActiveText({ text: "Text" });
    }
    setEditingTextId(null);
  };

  const handleInlineInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const getInlineInputStyles = () => {
    const canvas = canvasRef.current;
    const editingItem = textOverlays.find((t) => t.id === editingTextId);
    if (!canvas || !editingItem) return {};

    const rect = canvas.getBoundingClientRect();
    const visualX = (editingItem.x / canvas.width) * rect.width;
    const visualY = (editingItem.y / canvas.height) * rect.height;
    
    // Proportional font size scaled to visual display canvas size
    const visualFontSize = (editingItem.size / canvas.height) * rect.height;

    return {
      left: `${visualX}px`,
      top: `${visualY}px`,
      transform: `translate(-50%, -50%)`,
      fontSize: `${visualFontSize}px`,
      color: editingItem.color,
      fontFamily: editingItem.fontFamily,
      width: `${Math.max(160, editingItem.text.length * visualFontSize * 0.55 + 20)}px`,
      fontWeight: editingItem.fontFamily === "Impact" ? "900" : "normal",
      textTransform: editingItem.fontFamily === "Impact" ? "uppercase" as const : "none" as const,
    };
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

  // Updaters for selected text parameters
  const updateActiveText = (updatedFields: Partial<TextOverlay>) => {
    if (!activeTextId) return;
    setTextOverlays(
      textOverlays.map((t) => (t.id === activeTextId ? { ...t, ...updatedFields } : t))
    );
  };

  const handleDeleteActive = () => {
    if (!activeTextId) return;
    setTextOverlays(textOverlays.filter((t) => t.id !== activeTextId));
    setActiveTextId(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    // 1. Redraw canvas synchronously, forcing the selection outline to hide!
    redrawCanvas(true);
    
    // 2. Trigger download
    const link = document.createElement("a");
    const ext = downloadFormat;
    const originalName = image.name.substring(0, image.name.lastIndexOf(".")) || image.name;
    link.download = `${originalName}-edited.${ext}`;
    
    // Get data URL with selected format and full quality (1.0 for image/jpeg)
    link.href = canvas.toDataURL(`image/${ext === "png" ? "png" : "jpeg"}`, ext === "jpeg" ? 0.95 : undefined);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 3. Redraw canvas again to restore the selection outline for editing!
    redrawCanvas(false);
  };

  const handleReset = () => {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setTextOverlays([]);
    setActiveTextId(null);
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
            <Type className="h-7 w-7 text-indigo-500" />
            Add Text to Image
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium">
            Style and position customizable text overlays over your pictures. Drag text on canvas or double-click to edit inline.
          </p>
        </div>

        {/* Workspace Layout */}
        {!image ? (
          <div className="glass-panel rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col items-center justify-center transition-colors">
            <Dropzone
              onFileSelected={handleFileSelected}
              label="Drag & drop image to add text overlays"
              description="Supports PNG, JPEG, WEBP up to 15MB"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Control Panel (Left column on large screens) */}
            <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">
              
              {/* Text Layer Actions */}
              <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                  <AlignLeft className="h-4 w-4" />
                  Text Layers
                </h2>

                <button
                  onClick={addTextOverlay}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Text Overlay
                </button>

                {textOverlays.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 italic">
                    No text overlays created yet. Click above to add!
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                    {textOverlays.map((t, idx) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTextId(t.id)}
                        className={`w-full text-left truncate px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          t.id === activeTextId
                            ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
                            : "bg-slate-50 dark:bg-zinc-950/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                        }`}
                      >
                        <span className="truncate">Layer {idx + 1}: &quot;{t.text}&quot;</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Editing Settings */}
              {activeTextId && (
                <div className="glass-panel p-5 rounded-2xl border border-border space-y-4 animate-in fade-in duration-300">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                    <Settings className="h-4 w-4" />
                    Customize Layer
                  </h2>

                  {/* Input Box */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Text Content</label>
                    <input
                      type="text"
                      value={activeContent}
                      onChange={(e) => {
                        setActiveContent(e.target.value);
                        updateActiveText({ text: e.target.value });
                      }}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors"
                      placeholder="Enter overlay text..."
                    />
                  </div>

                  {/* Fonts family selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Font Style</label>
                    <select
                      value={activeFont}
                      onChange={(e) => {
                        setActiveFont(e.target.value);
                        updateActiveText({ fontFamily: e.target.value });
                      }}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white outline-none transition-colors"
                    >
                      {fonts.map((f) => (
                        <option key={f.value} value={f.value} className="bg-white dark:bg-[#090a0f] text-slate-900 dark:text-white">
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fonts size slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Font Size</label>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{activeSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="300"
                      value={activeSize}
                      onChange={(e) => {
                        const size = parseInt(e.target.value);
                        setActiveSize(size);
                        updateActiveText({ size });
                      }}
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Colors Grid Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setActiveColor(c);
                            updateActiveText({ color: c });
                          }}
                          className={`w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 relative transition-transform hover:scale-110 active:scale-95 ${
                            activeColor === c ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-zinc-950 scale-105" : ""
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      {/* Native Custom Picker */}
                      <input
                        type="color"
                        value={activeColor}
                        onChange={(e) => {
                          setActiveColor(e.target.value);
                          updateActiveText({ color: e.target.value });
                        }}
                        className="w-6 h-6 rounded-full border border-slate-200 dark:border-white/10 cursor-pointer overflow-hidden p-0 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Delete layer */}
                  <button
                    onClick={handleDeleteActive}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-all active:scale-95 mt-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Active Layer
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Main Workspace (Right columns on large screens) */}
            <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-2">
              {/* Canvas viewport container */}
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
                    onDoubleClick={handleDoubleClick}
                    className="max-w-full max-h-[550px] object-contain rounded-lg border border-border cursor-move checkerboard-bg"
                  />

                  {editingTextId && (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingInputValue}
                      onChange={handleInlineInputChange}
                      onBlur={handleInlineInputBlur}
                      onKeyDown={handleInlineInputKeyDown}
                      style={getInlineInputStyles()}
                      className="absolute z-10 p-1 border-2 border-dashed border-indigo-500 rounded bg-white/95 dark:bg-[#090a0f]/90 text-slate-800 dark:text-white outline-none text-center shadow-lg transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Bottom Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card shadow-sm">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                  Reset Image
                </button>

                <div className="flex items-center gap-3">
                  {/* Select download format */}
                  <div className="flex bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded-lg">
                    <button
                      onClick={() => setDownloadFormat("png")}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        downloadFormat === "png"
                          ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => setDownloadFormat("jpeg")}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        downloadFormat === "jpeg"
                          ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      JPEG
                    </button>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
