"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  Wand2,
  Download,
  Trash2,
  RotateCcw,
  Loader2,
  AlertCircle,
  Type as TypeIcon,
  Bold,
  Italic,
  Info,
  Check,
} from "lucide-react";
import Dropzone from "@/components/Dropzone";
import { EDIT_FONTS, FONT_CLASS_LABELS, FontClass } from "@/lib/editFonts";
import "@/app/edit-fonts.css";
import {
  analyzeImage,
  composite,
  ensureRegionFonts,
  TextRegion,
} from "@/lib/imageTextEngine";

type Phase = "idle" | "loading" | "analyzing" | "ready" | "error";

export default function ImageTextEditor() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("image");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ status: "", progress: 0 });

  const [regions, setRegions] = useState<TextRegion[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg">("png");
  const [showBoxes, setShowBoxes] = useState(true);

  /** pristine decode of the uploaded file — never drawn to */
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  /** what the user sees / what gets downloaded */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  const active = regions.find((r) => r.id === activeId) || null;

  /* ---------------- rendering ---------------- */

  const repaint = useCallback((list: TextRegion[]) => {
    const target = canvasRef.current;
    const original = originalRef.current;
    if (!target || !original) return;
    composite(target, original, list);
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    // a region switched to a face that hasn't been fetched yet (e.g. italic)
    // would otherwise draw in a fallback font until the next repaint
    let cancelled = false;
    repaint(regions);
    ensureRegionFonts(regions.filter((r) => r.edited)).then(() => {
      if (!cancelled) repaint(regions);
    });
    return () => {
      cancelled = true;
    };
  }, [regions, phase, repaint]);

  /** keep the HTML overlay boxes aligned with the on-screen canvas size */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || phase !== "ready") return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (el.width) setDisplayScale(rect.width / el.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [phase]);

  /* ---------------- upload + analyse ---------------- */

  const handleFile = async (file: File) => {
    setError(null);
    setPhase("loading");
    setRegions([]);
    setActiveId(null);
    setFileName(file.name.replace(/\.[^.]+$/, "") || "image");

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("That image could not be opened."));
        img.src = url;
      });

      const orig = document.createElement("canvas");
      orig.width = img.naturalWidth;
      orig.height = img.naturalHeight;
      orig.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      originalRef.current = orig;

      const target = canvasRef.current;
      if (target) {
        target.width = orig.width;
        target.height = orig.height;
        target.getContext("2d")!.drawImage(orig, 0, 0);
      }

      setPhase("analyzing");
      setProgress({ status: "Starting…", progress: 0.01 });

      const found = await analyzeImage(orig, setProgress);
      if (!found.length) {
        setError(
          "No editable text was found. This works on photos and screenshots that contain real, typed text — handwriting and very low-resolution text can't be matched yet."
        );
        setPhase("error");
        return;
      }
      setRegions(found);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  };

  /* ---------------- editing ---------------- */

  const patch = (id: string, changes: Partial<TextRegion>) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...changes,
              edited:
                changes.text !== undefined
                  ? changes.text !== r.original
                  : r.edited || true,
            }
          : r
      )
    );

  const revert = (id: string) =>
    setRegions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, text: r.original, edited: false } : r
      )
    );

  const revertAll = () =>
    setRegions((prev) =>
      prev.map((r) => ({ ...r, text: r.original, edited: false }))
    );

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const host = wrapRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale;
    const y = (e.clientY - rect.top) / displayScale;
    // smallest region containing the point wins, so overlapping lines are usable
    let hit: TextRegion | null = null;
    for (const r of regions) {
      if (
        x >= r.erase.x &&
        x <= r.erase.x + r.erase.w &&
        y >= r.erase.y &&
        y <= r.erase.y + r.erase.h
      ) {
        if (!hit || r.erase.w * r.erase.h < hit.erase.w * hit.erase.h) hit = r;
      }
    }
    setActiveId(hit ? hit.id : null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = downloadFormat === "png" ? "image/png" : "image/jpeg";
    const url = canvas.toDataURL(mime, 0.95);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}-edited.${downloadFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    originalRef.current = null;
    setRegions([]);
    setActiveId(null);
    setPhase("idle");
    setError(null);
  };

  const editedCount = regions.filter((r) => r.edited).length;

  /* ---------------- views ---------------- */

  if (phase === "idle" || phase === "error") {
    return (
      <div className="glass-panel rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col items-center justify-center gap-5">
        {error && (
          <div className="w-full max-w-3xl flex items-start gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <Dropzone
          onFileSelected={handleFile}
          label="Drop a photo or screenshot with text"
          description="PNG, JPEG or WEBP up to 15MB · the sharper the text, the better the match"
        />
      </div>
    );
  }

  if (phase === "loading" || phase === "analyzing") {
    return (
      <div className="glass-panel rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center gap-5 text-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-white">
            {progress.status || "Opening your image…"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reading the text and matching the fonts — all on your device.
          </p>
        </div>
        <div className="w-full max-w-sm h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-[width] duration-300"
            style={{ width: `${Math.round(progress.progress * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          The OCR engine is ~5MB and is cached after the first run.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* ---------- controls ---------- */}
      <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">
        <div className="glass-panel p-5 rounded-2xl border border-border space-y-3">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
            <TypeIcon className="h-4 w-4" />
            Detected text ({regions.length})
          </h2>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBoxes}
              onChange={(e) => setShowBoxes(e.target.checked)}
              className="accent-indigo-600 h-3.5 w-3.5"
            />
            Highlight editable lines
          </label>

          <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border flex items-start gap-2 ${
                  r.id === activeId
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
                    : "bg-slate-50 dark:bg-zinc-950/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"
                }`}
              >
                {r.edited && (
                  <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                )}
                <span className="truncate">{r.text || "(blank)"}</span>
              </button>
            ))}
          </div>
        </div>

        {active && (
          <div className="glass-panel p-5 rounded-2xl border border-border space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/80 pb-2">
              Edit line
            </h2>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Text
              </label>
              <textarea
                value={active.text}
                rows={2}
                onChange={(e) => patch(active.id, { text: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white outline-none transition-colors resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Matched font
              </label>
              <select
                value={active.fontId}
                onChange={(e) => patch(active.id, { fontId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white outline-none"
              >
                {(Object.keys(FONT_CLASS_LABELS) as FontClass[]).map((cls) => (
                  <optgroup
                    key={cls}
                    label={FONT_CLASS_LABELS[cls]}
                    className="bg-white dark:bg-[#090a0f]"
                  >
                    {EDIT_FONTS.filter((f) => f.cls === cls).map((f) => (
                      <option
                        key={f.id}
                        value={f.id}
                        className="bg-white dark:bg-[#090a0f]"
                      >
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => patch(active.id, { bold: !active.bold })}
                aria-pressed={active.bold}
                className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  active.bold
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Bold className="h-3.5 w-3.5" /> Bold
              </button>
              <button
                onClick={() => patch(active.id, { italic: !active.italic })}
                aria-pressed={active.italic}
                className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  active.italic
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Italic className="h-3.5 w-3.5" /> Italic
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Size
                </label>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                  {active.fontSize.toFixed(1)}px
                </span>
              </div>
              <input
                type="range"
                min={Math.max(4, active.fontSize * 0.5)}
                max={active.fontSize * 1.8}
                step={0.1}
                value={active.fontSize}
                onChange={(e) =>
                  patch(active.id, { fontSize: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Colour
                </label>
                <input
                  type="color"
                  value={active.color}
                  onChange={(e) => patch(active.id, { color: e.target.value })}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-zinc-800 cursor-pointer bg-transparent p-0.5"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Width
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Math.round(active.xScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.35}
                  step={0.01}
                  value={active.xScale}
                  onChange={(e) =>
                    patch(active.id, { xScale: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 mt-2.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nudge X
                  </label>
                </div>
                <input
                  type="range"
                  min={active.box.x - 20}
                  max={active.box.x + 20}
                  step={0.5}
                  value={active.leftX}
                  onChange={(e) =>
                    patch(active.id, { leftX: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nudge Y
                  </label>
                </div>
                <input
                  type="range"
                  min={active.box.y + active.box.h - 20}
                  max={active.box.y + active.box.h + 20}
                  step={0.5}
                  value={active.baselineY}
                  onChange={(e) =>
                    patch(active.id, { baselineY: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-200 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {active.edited && (
              <button
                onClick={() => revert(active.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore original line
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- canvas ---------- */}
      <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-2">
        <div className="w-full flex items-center justify-center border border-border rounded-2xl bg-card p-4 md:p-6 overflow-auto min-h-[400px]">
          <div
            ref={wrapRef}
            onClick={handleCanvasClick}
            className="relative inline-block shadow-md"
          >
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[600px] object-contain rounded-lg border border-border block cursor-text checkerboard-bg"
            />

            {showBoxes &&
              regions.map((r) => (
                <span
                  key={r.id}
                  aria-hidden
                  className={`absolute pointer-events-none rounded-[2px] transition-colors ${
                    r.id === activeId
                      ? "ring-2 ring-indigo-500 bg-indigo-500/10"
                      : r.edited
                      ? "ring-1 ring-emerald-500/70 bg-emerald-500/5"
                      : "ring-1 ring-indigo-400/30 hover:bg-indigo-400/10"
                  }`}
                  style={{
                    left: r.erase.x * displayScale,
                    top: r.erase.y * displayScale,
                    width: r.erase.w * displayScale,
                    height: r.erase.h * displayScale,
                  }}
                />
              ))}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Click any highlighted line on the image to edit it. The original
            pixels are reconstructed behind the text, and the replacement is
            drawn with the closest matching typeface, weight, size and colour —
            so the result reads as untouched. Works on typed text; handwriting
            is not supported yet.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded-2xl bg-card shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              New image
            </button>
            {editedCount > 0 && (
              <button
                onClick={revertAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-700 dark:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Undo all ({editedCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded-lg">
              {(["png", "jpeg"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDownloadFormat(f)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    downloadFormat === f
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
