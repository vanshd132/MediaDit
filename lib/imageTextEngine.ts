/**
 * imageTextEngine
 * ---------------
 * Everything needed to edit *real* text that is baked into a photo/screenshot
 * so that the result does not look edited.
 *
 * Pipeline
 *  1. OCR (tesseract.js, fully in-browser) -> text lines + bounding boxes.
 *  2. For every line we measure, from the actual pixels:
 *       - an "ink mask" (which pixels are glyph, which are background)
 *       - the text colour and the local background colour
 *       - the true baseline and the ink bounding box
 *  3. We then brute-force match the line against a library of metric-compatible
 *     web fonts: each candidate is rendered, aligned on its own baseline/left
 *     edge, and scored against the original ink mask (IoU + edge agreement).
 *     The winner gives us family + weight + italic + pixel size + x-scale.
 *  4. To apply an edit we *inpaint* the original glyph pixels away (cross
 *     interpolation from the surrounding pixels + smoothing + film-grain
 *     matching) and draw the new string with the matched font at the matched
 *     baseline.
 *
 * Everything always recomposes from the pristine original bitmap, so repeated
 * edits never accumulate artefacts.
 */

import { EDIT_FONTS, EditFont, fontById } from "./editFonts";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextRegion {
  id: string;
  /** what OCR read */
  original: string;
  /** what the user wants it to say */
  text: string;
  edited: boolean;
  /** ink bounding box, image pixels */
  box: Box;
  /** the region we erase — ink box plus padding */
  erase: Box;
  /** y of the alphabetic baseline, image pixels */
  baselineY: number;
  /** x where the ink starts, image pixels */
  leftX: number;
  fontId: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  /** "#rrggbb" */
  color: string;
  /** horizontal squeeze/stretch that made the match fit */
  xScale: number;
  /** OCR confidence 0..100 */
  confidence: number;
  /** how well the font matcher managed to reproduce the original, 0..1 */
  matchScore: number;
}

export interface AnalyzeProgress {
  status: string;
  progress: number;
}

const MAX_REGIONS = 120;
const MIN_CONFIDENCE = 35;
const MIN_INK_PIXELS = 12;
/** OCR likes ~30px tall text; we upscale small images to help it. */
const OCR_TARGET_MIN_DIM = 1000;
const OCR_MAX_DIM = 2600;

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

const toHex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0"))
    .join("");

export const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
};

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** perceptual-ish distance, cheap */
const colorDist = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) => {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
};

/* ------------------------------------------------------------------ */
/* 1. OCR                                                              */
/* ------------------------------------------------------------------ */

type TessLine = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

async function ocrLines(
  source: HTMLCanvasElement,
  onProgress: (p: AnalyzeProgress) => void
): Promise<{ lines: TessLine[]; scale: number }> {
  const { createWorker, PSM } = await import("tesseract.js");

  // Upscale tiny images / downscale huge ones so OCR sees ~30px glyphs.
  const minDim = Math.min(source.width, source.height);
  const maxDim = Math.max(source.width, source.height);
  let scale = 1;
  if (minDim < OCR_TARGET_MIN_DIM) scale = OCR_TARGET_MIN_DIM / minDim;
  if (maxDim * scale > OCR_MAX_DIM) scale = OCR_MAX_DIM / maxDim;
  scale = clamp(scale, 0.35, 3);

  let ocrInput: HTMLCanvasElement = source;
  if (Math.abs(scale - 1) > 0.02) {
    ocrInput = makeCanvas(source.width * scale, source.height * scale);
    const c = ocrInput.getContext("2d")!;
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    c.drawImage(source, 0, 0, ocrInput.width, ocrInput.height);
  } else {
    scale = 1;
  }

  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress({ status: "Reading the text…", progress: 0.15 + m.progress * 0.5 });
      } else if (m.status.includes("loading") || m.status.includes("initializ")) {
        onProgress({ status: "Loading the OCR engine…", progress: 0.05 });
      }
    },
  });

  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const { data } = await worker.recognize(
      ocrInput,
      {},
      { blocks: true, text: false }
    );

    const lines: TessLine[] = [];
    for (const block of data.blocks || []) {
      for (const para of block.paragraphs || []) {
        for (const line of para.lines || []) {
          const text = (line.text || "").replace(/\s+/g, " ").trim();
          if (!text) continue;
          lines.push({ text, confidence: line.confidence, bbox: line.bbox });
        }
      }
    }
    return { lines, scale };
  } finally {
    await worker.terminate();
  }
}

/* ------------------------------------------------------------------ */
/* 2. measuring a line from its pixels                                 */
/* ------------------------------------------------------------------ */

interface InkInfo {
  /** 0/1 per pixel, size cw*ch, relative to the crop */
  mask: Uint8Array;
  cw: number;
  ch: number;
  /** ink bbox within the crop */
  inkX: number;
  inkY: number;
  inkW: number;
  inkH: number;
  /** baseline within the crop */
  baseline: number;
  count: number;
  fg: string;
  bg: string;
  /** stroke thickness relative to x-height — used for bold detection */
  boldness: number;
  /** mean slant of vertical strokes, radians — used for italic detection */
  slant: number;
}

/**
 * Work out which pixels in a crop are glyph and which are page, plus the
 * colours involved. The background estimate deliberately only looks at the
 * *border* ring of the crop so glyph pixels can never pollute it.
 */
function measureInk(
  data: Uint8ClampedArray,
  cw: number,
  ch: number
): InkInfo | null {
  // --- background: median of the border ring -------------------------------
  const bgR: number[] = [];
  const bgG: number[] = [];
  const bgB: number[] = [];
  const pushPx = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cw || y >= ch) return;
    const i = (y * cw + x) * 4;
    bgR.push(data[i]);
    bgG.push(data[i + 1]);
    bgB.push(data[i + 2]);
  };
  for (let x = 0; x < cw; x++) {
    pushPx(x, 0);
    pushPx(x, 1);
    pushPx(x, ch - 1);
    pushPx(x, ch - 2);
  }
  for (let y = 0; y < ch; y++) {
    pushPx(0, y);
    pushPx(1, y);
    pushPx(cw - 1, y);
    pushPx(cw - 2, y);
  }
  if (!bgR.length) return null;
  const median = (a: number[]) => {
    const s = a.slice().sort((p, q) => p - q);
    return s[s.length >> 1];
  };
  const br = median(bgR);
  const bg_ = median(bgG);
  const bb = median(bgB);

  // --- ink: everything far enough from the background ----------------------
  // Otsu-style threshold on the distance-from-background histogram.
  const dist = new Float32Array(cw * ch);
  let maxDist = 0;
  for (let p = 0; p < cw * ch; p++) {
    const i = p * 4;
    const d = colorDist(data[i], data[i + 1], data[i + 2], br, bg_, bb);
    dist[p] = d;
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 18) return null; // no real contrast -> not editable text

  const bins = 64;
  const hist = new Float64Array(bins);
  for (let p = 0; p < dist.length; p++) {
    hist[Math.min(bins - 1, Math.floor((dist[p] / maxDist) * bins))]++;
  }
  let total = dist.length;
  let sumAll = 0;
  for (let b = 0; b < bins; b++) sumAll += b * hist[b];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestVar = -1;
  for (let b = 0; b < bins; b++) {
    wB += hist[b];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += b * hist[b];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) {
      bestVar = between;
      best = b;
    }
  }
  const threshold = Math.max(22, ((best + 0.5) / bins) * maxDist);

  const mask = new Uint8Array(cw * ch);
  let count = 0;
  let fr = 0;
  let fg = 0;
  let fb = 0;
  let fw = 0;
  let inkX0 = cw;
  let inkY0 = ch;
  let inkX1 = -1;
  let inkY1 = -1;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const p = y * cw + x;
      if (dist[p] < threshold) continue;
      mask[p] = 1;
      count++;
      if (x < inkX0) inkX0 = x;
      if (x > inkX1) inkX1 = x;
      if (y < inkY0) inkY0 = y;
      if (y > inkY1) inkY1 = y;
      // weight the colour average towards the *core* of the stroke so
      // anti-aliased edge pixels don't wash the colour out
      const wgt = dist[p] / maxDist;
      const i = p * 4;
      fr += data[i] * wgt;
      fg += data[i + 1] * wgt;
      fb += data[i + 2] * wgt;
      fw += wgt;
    }
  }
  if (count < MIN_INK_PIXELS || inkX1 < 0) return null;

  // Re-estimate the foreground using only the strongest 40% of ink pixels —
  // this lands on the solid centre of the glyph rather than its halo.
  const strong: number[] = [];
  for (let p = 0; p < mask.length; p++) if (mask[p]) strong.push(dist[p]);
  strong.sort((a, b) => b - a);
  const coreCut = strong[Math.floor(strong.length * 0.4)] ?? threshold;
  let cr = 0;
  let cg = 0;
  let cb = 0;
  let cn = 0;
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p] || dist[p] < coreCut) continue;
    const i = p * 4;
    cr += data[i];
    cg += data[i + 1];
    cb += data[i + 2];
    cn++;
  }
  const fgHex =
    cn > 4 ? toHex(cr / cn, cg / cn, cb / cn) : toHex(fr / fw, fg / fw, fb / fw);

  // --- baseline: lowest row that still carries the bulk of the ink ---------
  const rowCount = new Int32Array(ch);
  for (let y = 0; y < ch; y++) {
    let n = 0;
    for (let x = 0; x < cw; x++) if (mask[y * cw + x]) n++;
    rowCount[y] = n;
  }
  let maxRow = 0;
  for (let y = 0; y < ch; y++) if (rowCount[y] > maxRow) maxRow = rowCount[y];
  let baseline = inkY1 + 1;
  for (let y = inkY1; y >= inkY0; y--) {
    if (rowCount[y] >= maxRow * 0.28) {
      baseline = y + 1;
      break;
    }
  }

  // --- boldness: ink area / (ink bbox area) normalised by x-height ---------
  const xHeight = Math.max(1, baseline - inkY0);
  const runLens: number[] = [];
  for (let y = inkY0; y <= inkY1; y++) {
    let run = 0;
    for (let x = inkX0; x <= inkX1 + 1; x++) {
      const on = x <= inkX1 && mask[y * cw + x];
      if (on) run++;
      else {
        if (run > 0 && run < xHeight) runLens.push(run);
        run = 0;
      }
    }
  }
  runLens.sort((a, b) => a - b);
  const strokeW = runLens.length
    ? runLens[Math.floor(runLens.length * 0.5)]
    : 1;
  const boldness = strokeW / xHeight;

  // --- slant: find the shear that best straightens the vertical stems -------
  // Italic text leans, so shearing it back by the right angle makes stems line
  // up into columns and the column-ink histogram becomes much peakier. The
  // angle that maximises that peakiness is the slant. (Comparing the centre of
  // mass of the top half against the bottom half — the obvious approach — does
  // not work: it mostly measures where the tall letters happen to sit.)
  let slant = 0;
  {
    const bandTop = inkY0;
    const bandBot = baseline;
    if (bandBot - bandTop >= 4 && inkX1 - inkX0 >= 4) {
      const colsW = inkX1 - inkX0 + 1;
      const extra = Math.ceil((bandBot - bandTop) * 0.45) + 2;
      const hist = new Float64Array(colsW + extra * 2);
      let bestEnergy = -1;
      for (let step = -7; step <= 7; step++) {
        const angle = step * 0.05;
        const t = Math.tan(angle);
        hist.fill(0);
        for (let y = bandTop; y < bandBot; y++) {
          const shift = (baseline - y) * t;
          for (let x = inkX0; x <= inkX1; x++) {
            if (!mask[y * cw + x]) continue;
            const col = Math.round(x - inkX0 - shift) + extra;
            if (col >= 0 && col < hist.length) hist[col]++;
          }
        }
        let energy = 0;
        let sum = 0;
        for (let c = 0; c < hist.length; c++) {
          energy += hist[c] * hist[c];
          sum += hist[c];
        }
        if (sum < 1) continue;
        energy /= sum * sum;
        if (energy > bestEnergy) {
          bestEnergy = energy;
          slant = angle;
        }
      }
    }
  }

  return {
    mask,
    cw,
    ch,
    inkX: inkX0,
    inkY: inkY0,
    inkW: inkX1 - inkX0 + 1,
    inkH: inkY1 - inkY0 + 1,
    baseline,
    count,
    fg: fgHex,
    bg: toHex(br, bg_, bb),
    boldness,
    slant,
  };
}

/* ------------------------------------------------------------------ */
/* 3. font matching                                                    */
/* ------------------------------------------------------------------ */

let matchCanvas: HTMLCanvasElement | null = null;

/** Stroke-width-to-cap-height above which a line is treated as bold. Only a
 *  starting guess — the final weight is settled by comparing the candidate's
 *  measured stroke against the original's (see decideWeight). */
const BOLD_THRESHOLD = 0.19;
/** Stem lean, radians, above which italic candidates are considered. Real
 *  italics sit around 0.20-0.26 rad, so this leaves plenty of headroom. */
const SLANT_THRESHOLD = 0.08;

interface CandMask {
  mask: Uint8Array;
  w: number;
  h: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  count: number;
  baseline: number;
  /** stroke thickness relative to cap height, measured exactly like InkInfo */
  stroke: number;
}

/** Median horizontal ink run — the same stroke-thickness probe used on both
 *  the scanned glyphs and the candidate renders, so the two are comparable. */
function medianRun(
  mask: Uint8Array,
  stride: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  limit: number
): number {
  const runs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    let run = 0;
    for (let x = x0; x <= x1 + 1; x++) {
      const on = x <= x1 && mask[y * stride + x];
      if (on) run++;
      else {
        if (run > 0 && run < limit) runs.push(run);
        run = 0;
      }
    }
  }
  if (!runs.length) return 1;
  runs.sort((a, b) => a - b);
  return runs[Math.floor(runs.length * 0.5)];
}

/**
 * Render `text` and return its own ink mask plus its own measured baseline, so
 * a candidate can be aligned to the original like-for-like rather than relying
 * on absolute font metrics.
 *
 * The scratch canvas is deliberately much larger than the target box: if the
 * render were clipped, the measured width would be wrong and every downstream
 * decision (size, x-scale, score) would be wrong with it.
 */
function renderCandidateMask(
  text: string,
  font: EditFont,
  bold: boolean,
  italic: boolean,
  size: number
): CandMask {
  const fakeItalic = italic && !font.hasItalic;
  const fontSpec = `${italic && font.hasItalic ? "italic " : ""}${
    bold ? "700" : "400"
  } ${size}px ${font.family}`;

  // Size the scratch canvas from the real glyph metrics. Anything larger just
  // wastes getImageData bandwidth (this runs hundreds of times per line);
  // anything smaller clips the render and corrupts every measurement taken
  // from it.
  const probeCtx = measureCtx();
  probeCtx.setTransform(1, 0, 0, 1, 0, 0);
  probeCtx.font = fontSpec;
  const m = probeCtx.measureText(text);
  const left = m.actualBoundingBoxLeft ?? 0;
  const right = m.actualBoundingBoxRight ?? m.width;
  const asc = m.actualBoundingBoxAscent ?? size * 0.8;
  const desc = m.actualBoundingBoxDescent ?? size * 0.25;
  const shear = fakeItalic ? Math.tan(0.23) * (asc + desc) : 0;
  const pad = 3;
  const w = Math.ceil(left + right + shear) + pad * 2;
  const h = Math.ceil(asc + desc) + pad * 2;
  if (!isFinite(w) || !isFinite(h) || w < 2 || h < 2) {
    return { mask: new Uint8Array(1), w: 1, h: 1, x0: 0, y0: 0, x1: 0, y1: 0, count: 0, baseline: 0, stroke: 0 };
  }

  if (!matchCanvas) matchCanvas = makeCanvas(w, h);
  if (matchCanvas.width < w || matchCanvas.height < h) {
    matchCanvas.width = Math.max(matchCanvas.width, w);
    matchCanvas.height = Math.max(matchCanvas.height, h);
  }
  const ctx = matchCanvas.getContext("2d", { willReadFrequently: true })!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = fontSpec;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#000";
  const drawX = pad + left + shear;
  const drawBaseline = pad + asc;
  if (fakeItalic) {
    ctx.save();
    ctx.transform(1, 0, -Math.tan(0.23), 1, Math.tan(0.23) * drawBaseline, 0);
    ctx.fillText(text, drawX, drawBaseline);
    ctx.restore();
  } else {
    ctx.fillText(text, drawX, drawBaseline);
  }

  const img = ctx.getImageData(0, 0, w, h);
  const mask = new Uint8Array(w * h);
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let p = 0; p < w * h; p++) {
    if (img.data[p * 4 + 3] > 96) {
      mask[p] = 1;
      count++;
      const x = p % w;
      const y = (p / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (count === 0) {
    return {
      mask, w, h, x0: 0, y0: 0, x1: 0, y1: 0, count: 0, baseline: 0, stroke: 0,
    };
  }
  // measure the render's baseline exactly the way the original was measured
  const rowCount = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (mask[y * w + x]) n++;
    rowCount[y] = n;
  }
  let maxRow = 0;
  for (let y = 0; y < h; y++) if (rowCount[y] > maxRow) maxRow = rowCount[y];
  let base = y1 + 1;
  for (let y = y1; y >= y0; y--) {
    if (rowCount[y] >= maxRow * 0.28) {
      base = y + 1;
      break;
    }
  }
  const capH = Math.max(1, base - y0);
  const stroke = medianRun(mask, w, x0, y0, x1, y1, capH) / capH;
  return { mask, w, h, x0, y0, x1, y1, count, baseline: base, stroke };
}

/**
 * Intersection-over-union of the candidate against the original ink, after
 * aligning left edge to left edge and baseline to baseline, plus an extra
 * (ddx, ddy) nudge so the caller can hunt for the best sub-pixel placement.
 */
function scoreAgainst(
  ink: InkInfo,
  cand: CandMask,
  ddx = 0,
  ddy = 0
): number {
  if (cand.count === 0) return 0;
  const dx = ink.inkX - cand.x0 + ddx;
  const dy = ink.baseline - cand.baseline + ddy;
  let inter = 0;
  let union = 0;
  const y0 = Math.min(ink.inkY, cand.y0 + dy) - 2;
  const y1 = Math.max(ink.inkY + ink.inkH, cand.y1 + dy) + 2;
  const x0 = Math.min(ink.inkX, cand.x0 + dx) - 2;
  const x1 = Math.max(ink.inkX + ink.inkW, cand.x1 + dx) + 2;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const a =
        y >= 0 && y < ink.ch && x >= 0 && x < ink.cw ? ink.mask[y * ink.cw + x] : 0;
      const cy = y - dy;
      const cx = x - dx;
      const b =
        cy >= 0 && cy < cand.h && cx >= 0 && cx < cand.w
          ? cand.mask[cy * cand.w + cx]
          : 0;
      if (a | b) union++;
      if (a & b) inter++;
    }
  }
  if (union === 0) return 0;
  const iou = inter / union;

  // Raw overlap alone is a biased judge. A heavier weight always covers more of
  // the (slightly dilated) scanned mask, so a marginally undersized candidate
  // can buy back overlap by going bold. Stroke thickness and cap height are
  // both *ratios*, so they are immune to that size error — which makes them the
  // trustworthy signal for weight. Stroke is weighted heavily on purpose: it
  // decides bold, while IoU is left to decide the family and the size.
  const inkCap = Math.max(1, ink.baseline - ink.inkY);
  const candCap = Math.max(1, cand.baseline - cand.y0);
  const capPenalty = Math.abs(candCap - inkCap) / inkCap;
  const strokePenalty = Math.abs(cand.stroke - ink.boldness);
  return iou - 1.5 * strokePenalty - 0.8 * Math.min(1, capPenalty);
}

interface FontFit {
  fontId: string;
  bold: boolean;
  italic: boolean;
  size: number;
  xScale: number;
  /** placement nudges, image pixels */
  dx: number;
  dy: number;
  score: number;
}

const measureCtx = () =>
  (matchCanvas ||= makeCanvas(64, 64)).getContext("2d", {
    willReadFrequently: true,
  })!;

/** Analytic first guess at the pixel size that reproduces the original ink. */
function guessSize(text: string, ink: InkInfo, font: EditFont, bold: boolean, italic: boolean) {
  const ctx = measureCtx();
  const probe = 100;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `${italic && font.hasItalic ? "italic " : ""}${
    bold ? "700" : "400"
  } ${probe}px ${font.family}`;
  const probeW = ctx.measureText(text).width;
  if (!probeW || !isFinite(probeW)) return null;

  const byWidth = (ink.inkW / probeW) * probe;
  // cap height is ~0.70-0.72 em for almost every text face
  const byHeight = (ink.baseline - ink.inkY) / 0.72;
  // short strings have unreliable widths; long strings have unreliable heights
  // (a line with no ascenders/capitals reads far too short)
  const letters = text.replace(/[^A-Za-z0-9]/g, "").length;
  const size = letters <= 3 ? byHeight : byWidth * 0.7 + byHeight * 0.3;
  return clamp(size, 5, 900);
}

/** Cheap single-shot score, used to pick the family/weight/style. */
function coarseFit(
  text: string,
  ink: InkInfo,
  font: EditFont,
  bold: boolean,
  italic: boolean
): FontFit | null {
  const size = guessSize(text, ink, font, bold, italic);
  if (size === null) return null;
  const cand = renderCandidateMask(text, font, bold, italic, size);
  if (!cand.count) return null;
  const renderedW = cand.x1 - cand.x0 + 1;
  return {
    fontId: font.id,
    bold,
    italic,
    size,
    xScale: clamp(ink.inkW / Math.max(1, renderedW), 0.8, 1.25),
    dx: 0,
    dy: 0,
    score: scoreAgainst(ink, cand),
  };
}

/**
 * Take a coarse candidate and polish it: alternate a 1-D search over pixel size
 * with a small 2-D search over placement, maximising mask overlap each time.
 * This is what turns "roughly the right font" into "lands on the same pixels".
 */
function refineFit(text: string, ink: InkInfo, start: FontFit): FontFit {
  const font = fontById(start.fontId);
  let best = { ...start };

  const evaluate = (size: number, dx: number, dy: number) => {
    const cand = renderCandidateMask(text, font, best.bold, best.italic, size);
    if (!cand.count) return null;
    const renderedW = cand.x1 - cand.x0 + 1;
    return {
      score: scoreAgainst(ink, cand, dx, dy),
      xScale: clamp(ink.inkW / Math.max(1, renderedW), 0.8, 1.25),
    };
  };

  for (let pass = 0; pass < 2; pass++) {
    const span = pass === 0 ? 0.15 : 0.04;
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      const size = best.size * (1 + (span * k) / 3);
      if (size < 4) continue;
      const r = evaluate(size, best.dx, best.dy);
      if (r && r.score > best.score) {
        best = { ...best, size, xScale: r.xScale, score: r.score };
      }
    }
    const reach = pass === 0 ? 2 : 1;
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ndx = best.dx + dx;
        const ndy = best.dy + dy;
        const r = evaluate(best.size, ndx, ndy);
        if (r && r.score > best.score) {
          best = { ...best, dx: ndx, dy: ndy, xScale: r.xScale, score: r.score };
        }
      }
    }
  }
  return best;
}

/**
 * Decide bold purely by measurement, never by overlap.
 *
 * Stroke-thickness-over-cap-height is a ratio, so unlike overlap it is immune
 * to a few percent of size error — which is exactly the error that used to let
 * an undersized regular face get "corrected" into a bold one. Rendering both
 * weights of the already-chosen family and keeping whichever stroke ratio sits
 * closer to the original's settles the question on its own terms.
 */
function decideWeight(text: string, ink: InkInfo, fit: FontFit): boolean {
  const font = fontById(fit.fontId);
  const probe = (bold: boolean) => {
    const c = renderCandidateMask(text, font, bold, fit.italic, fit.size);
    return c.count ? Math.abs(c.stroke - ink.boldness) : Infinity;
  };
  const regular = probe(false);
  const bold = probe(true);
  if (!isFinite(regular) && !isFinite(bold)) return fit.bold;
  return bold < regular;
}

/**
 * Cheap size-and-placement sweep. A candidate's coarse score comes from one
 * analytic size guess at zero offset, and both of those can be wrong enough to
 * rank the correct typeface below an impostor — whichever candidate happens to
 * suit the initial guess wins. Giving every candidate the same modest chance to
 * settle costs a handful of small renders and makes the shortlist trustworthy.
 */
function sweepSize(text: string, ink: InkInfo, start: FontFit): FontFit {
  const font = fontById(start.fontId);
  let best = start;

  const evaluate = (size: number, dx: number, dy: number) => {
    const cand = renderCandidateMask(text, font, start.bold, start.italic, size);
    if (!cand.count) return null;
    const renderedW = cand.x1 - cand.x0 + 1;
    return {
      score: scoreAgainst(ink, cand, dx, dy),
      xScale: clamp(ink.inkW / Math.max(1, renderedW), 0.8, 1.25),
    };
  };

  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue;
    const size = start.size * (1 + (0.15 * k) / 3);
    if (size < 4) continue;
    const r = evaluate(size, best.dx, best.dy);
    if (r && r.score > best.score) {
      best = { ...best, size, score: r.score, xScale: r.xScale };
    }
  }
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const r = evaluate(best.size, best.dx + dx, best.dy + dy);
      if (r && r.score > best.score) {
        best = {
          ...best,
          dx: best.dx + dx,
          dy: best.dy + dy,
          score: r.score,
          xScale: r.xScale,
        };
      }
    }
  }
  return best;
}

function bestFontFor(
  text: string,
  ink: InkInfo,
  families: EditFont[]
): FontFit | null {
  const boldGuesses = ink.boldness > BOLD_THRESHOLD ? [true, false] : [false, true];
  // A coarse render can be mis-sized enough to rank the right family second,
  // so keep the leading few and let the refined score settle it.
  const italics = ink.slant > SLANT_THRESHOLD ? [true, false] : [false];

  const coarse: FontFit[] = [];
  for (const font of families) {
    for (const bold of boldGuesses) {
      for (const italic of italics) {
        const fit = coarseFit(text, ink, font, bold, italic);
        if (fit) coarse.push(fit);
      }
    }
  }
  if (!coarse.length) return null;
  coarse.sort((a, b) => b.score - a.score);

  // Sweep every candidate, not a pre-cut list: the one-shot coarse score is
  // exactly what cannot be trusted to make the cut correctly.
  const semi = coarse.slice(0, 16).map((c) => sweepSize(text, ink, c));
  semi.sort((a, b) => b.score - a.score);

  let best: FontFit | null = null;
  for (const cand of semi.slice(0, 4)) {
    const refined = refineFit(text, ink, cand);
    if (!best || refined.score > best.score) best = refined;
  }
  if (!best) return null;

  // Settle the weight on measured stroke thickness, then re-fit the size for
  // it: a size tuned around the wrong weight is the wrong size.
  const bold = decideWeight(text, ink, best);
  if (bold !== best.bold) best = refineFit(text, ink, { ...best, bold });
  return best;
}

/* ------------------------------------------------------------------ */
/* 4. inpainting                                                       */
/* ------------------------------------------------------------------ */

/**
 * Erase `box` from `ctx` by reconstructing what was behind the glyphs.
 *
 * Cross-interpolation: every unknown pixel is a distance-weighted blend of the
 * nearest known pixel to its left, right, top and bottom. This reproduces flat
 * fills *and* smooth gradients (very common behind text) essentially exactly.
 * A few Jacobi passes remove the seams, and finally we re-inject grain sampled
 * from the surrounding area so the patch doesn't read as suspiciously smooth.
 */
export function inpaintBox(ctx: CanvasRenderingContext2D, box: Box) {
  const margin = Math.max(3, Math.ceil(Math.min(box.w, box.h) * 0.35), 6);
  const sx = Math.max(0, Math.floor(box.x - margin));
  const sy = Math.max(0, Math.floor(box.y - margin));
  const ex = Math.min(ctx.canvas.width, Math.ceil(box.x + box.w + margin));
  const ey = Math.min(ctx.canvas.height, Math.ceil(box.y + box.h + margin));
  const w = ex - sx;
  const h = ey - sy;
  if (w <= 2 || h <= 2) return;

  const img = ctx.getImageData(sx, sy, w, h);
  const d = img.data;

  // mask: 1 = unknown (to be reconstructed)
  const hx0 = clamp(Math.floor(box.x) - sx, 0, w - 1);
  const hy0 = clamp(Math.floor(box.y) - sy, 0, h - 1);
  const hx1 = clamp(Math.ceil(box.x + box.w) - sx, 0, w);
  const hy1 = clamp(Math.ceil(box.y + box.h) - sy, 0, h);
  const hole = new Uint8Array(w * h);
  for (let y = hy0; y < hy1; y++)
    for (let x = hx0; x < hx1; x++) hole[y * w + x] = 1;

  const out = new Float32Array(w * h * 3);
  for (let p = 0; p < w * h; p++) {
    out[p * 3] = d[p * 4];
    out[p * 3 + 1] = d[p * 4 + 1];
    out[p * 3 + 2] = d[p * 4 + 2];
  }

  // -- pass 1: cross interpolation ----------------------------------------
  // For each row, find the known pixel bounding each run of holes.
  const accum = new Float32Array(w * h * 3);
  const weight = new Float32Array(w * h);

  const blendRun = (
    idxOf: (i: number) => number,
    aIdx: number,
    bIdx: number,
    len: number,
    hasA: boolean,
    hasB: boolean
  ) => {
    if (!hasA && !hasB) return;
    for (let k = 0; k < len; k++) {
      const p = idxOf(k);
      let t = (k + 1) / (len + 1);
      let ar = 0;
      let ag = 0;
      let ab = 0;
      if (hasA && hasB) {
        ar = out[aIdx * 3] * (1 - t) + out[bIdx * 3] * t;
        ag = out[aIdx * 3 + 1] * (1 - t) + out[bIdx * 3 + 1] * t;
        ab = out[aIdx * 3 + 2] * (1 - t) + out[bIdx * 3 + 2] * t;
      } else {
        const s = hasA ? aIdx : bIdx;
        ar = out[s * 3];
        ag = out[s * 3 + 1];
        ab = out[s * 3 + 2];
        t = hasA ? 1 - t : t;
      }
      // closer to a known edge -> more trustworthy
      const wgt = 1 / (1 + Math.min(k + 1, len - k) * 0.08);
      accum[p * 3] += ar * wgt;
      accum[p * 3 + 1] += ag * wgt;
      accum[p * 3 + 2] += ab * wgt;
      weight[p] += wgt;
    }
  };

  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!hole[y * w + x]) {
        x++;
        continue;
      }
      let e = x;
      while (e < w && hole[y * w + e]) e++;
      const hasA = x - 1 >= 0;
      const hasB = e < w;
      blendRun((k) => y * w + x + k, y * w + x - 1, y * w + e, e - x, hasA, hasB);
      x = e;
    }
  }
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      if (!hole[y * w + x]) {
        y++;
        continue;
      }
      let e = y;
      while (e < h && hole[e * w + x]) e++;
      const hasA = y - 1 >= 0;
      const hasB = e < h;
      blendRun((k) => (y + k) * w + x, (y - 1) * w + x, e * w + x, e - y, hasA, hasB);
      y = e;
    }
  }

  for (let p = 0; p < w * h; p++) {
    if (!hole[p] || weight[p] === 0) continue;
    out[p * 3] = accum[p * 3] / weight[p];
    out[p * 3 + 1] = accum[p * 3 + 1] / weight[p];
    out[p * 3 + 2] = accum[p * 3 + 2] / weight[p];
  }

  // -- pass 2: Jacobi smoothing to kill the cross seams --------------------
  const tmp = new Float32Array(out.length);
  tmp.set(out);
  const iterations = clamp(Math.round(Math.min(w, h) * 1.2), 8, 90);
  for (let it = 0; it < iterations; it++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (!hole[p]) continue;
        for (let c = 0; c < 3; c++) {
          tmp[p * 3 + c] =
            (out[(p - 1) * 3 + c] +
              out[(p + 1) * 3 + c] +
              out[(p - w) * 3 + c] +
              out[(p + w) * 3 + c]) *
            0.25;
        }
      }
    }
    out.set(tmp);
  }

  // -- pass 3: match the local grain ---------------------------------------
  // Measure the high-frequency energy of the *known* ring, then add matching
  // noise so the reconstruction blends into a grainy/JPEG-y photo.
  let varSum = 0;
  let varN = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (hole[p] || hole[p - 1] || hole[p + 1] || hole[p - w] || hole[p + w])
        continue;
      const lap =
        out[p * 3] * 4 -
        out[(p - 1) * 3] -
        out[(p + 1) * 3] -
        out[(p - w) * 3] -
        out[(p + w) * 3];
      varSum += lap * lap;
      varN++;
    }
  }
  const grain = varN > 20 ? clamp(Math.sqrt(varSum / varN) * 0.28, 0, 6) : 0;

  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (hole[p] && grain > 0.2) {
      const n = (Math.random() - 0.5) * 2 * grain;
      d[i] = clamp(out[p * 3] + n, 0, 255);
      d[i + 1] = clamp(out[p * 3 + 1] + n, 0, 255);
      d[i + 2] = clamp(out[p * 3 + 2] + n, 0, 255);
    } else if (hole[p]) {
      d[i] = clamp(out[p * 3], 0, 255);
      d[i + 1] = clamp(out[p * 3 + 1], 0, 255);
      d[i + 2] = clamp(out[p * 3 + 2], 0, 255);
    }
  }

  ctx.putImageData(img, sx, sy);
}

/* ------------------------------------------------------------------ */
/* 5. public API                                                       */
/* ------------------------------------------------------------------ */

export async function analyzeImage(
  source: HTMLCanvasElement,
  onProgress: (p: AnalyzeProgress) => void
): Promise<TextRegion[]> {
  onProgress({ status: "Starting the OCR engine…", progress: 0.02 });
  const { lines, scale } = await ocrLines(source, onProgress);

  onProgress({ status: "Measuring the text…", progress: 0.7 });

  const sctx = source.getContext("2d", { willReadFrequently: true })!;
  const inv = 1 / scale;

  interface Pending {
    line: TessLine;
    ink: InkInfo;
    crop: Box;
    text: string;
  }

  const pending: Pending[] = [];
  for (const line of lines) {
    if (line.confidence < MIN_CONFIDENCE) continue;
    if (pending.length >= MAX_REGIONS) break;

    const bx = line.bbox.x0 * inv;
    const by = line.bbox.y0 * inv;
    const bw = (line.bbox.x1 - line.bbox.x0) * inv;
    const bh = (line.bbox.y1 - line.bbox.y0) * inv;
    if (bw < 4 || bh < 4) continue;

    // pad generously so descenders/accents and clean background are included
    const padX = Math.max(3, bh * 0.35);
    const padY = Math.max(3, bh * 0.45);
    const cx = clamp(Math.floor(bx - padX), 0, source.width - 1);
    const cy = clamp(Math.floor(by - padY), 0, source.height - 1);
    const cw = clamp(Math.ceil(bw + padX * 2), 1, source.width - cx);
    const ch = clamp(Math.ceil(bh + padY * 2), 1, source.height - cy);
    if (cw < 5 || ch < 5) continue;

    const crop = sctx.getImageData(cx, cy, cw, ch);
    const ink = measureInk(crop.data, cw, ch);
    if (!ink) continue;

    pending.push({ line, ink, crop: { x: cx, y: cy, w: cw, h: ch }, text: line.text });
  }

  onProgress({ status: "Identifying the fonts…", progress: 0.78 });

  // Documents almost always use one or two typefaces. Elect the family on the
  // best few lines, then only trial the winners per line — much faster and far
  // more consistent than picking a different font for every line.
  const electors = pending
    .filter((p) => p.text.replace(/[^A-Za-z]/g, "").length >= 6)
    .sort((a, b) => b.ink.count - a.ink.count)
    .slice(0, 5);

  const tally = new Map<string, number>();
  for (const e of electors) {
    for (const font of EDIT_FONTS) {
      const fit = coarseFit(
        e.text,
        e.ink,
        font,
        e.ink.boldness > BOLD_THRESHOLD,
        e.ink.slant > SLANT_THRESHOLD
      );
      if (fit) tally.set(font.id, (tally.get(font.id) || 0) + fit.score);
    }
  }
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  // Always keep the metric-compatible clones of Arial, Times, Courier, Calibri
  // and Cambria in play: between them they cover the overwhelming majority of
  // real documents, screenshots and UI text.
  const CORE = ["arimo", "tinos", "cousine", "carlito", "caladea"];
  const shortlistIds = new Set<string>(CORE);
  for (const [id] of ranked.slice(0, 3)) shortlistIds.add(id);
  const shortlist = [...shortlistIds].map(fontById);

  const regions: TextRegion[] = [];
  for (let i = 0; i < pending.length; i++) {
    const { ink, crop, text, line } = pending[i];
    const fit =
      bestFontFor(text, ink, shortlist) ||
      ({
        fontId: shortlist[0].id,
        bold: ink.boldness > BOLD_THRESHOLD,
        italic: ink.slant > SLANT_THRESHOLD,
        size: (ink.baseline - ink.inkY) / 0.72,
        xScale: 1,
        dx: 0,
        dy: 0,
        score: 0,
      } as FontFit);

    regions.push({
      id: `r${i}_${Math.random().toString(36).slice(2, 8)}`,
      original: text,
      text,
      edited: false,
      box: {
        x: crop.x + ink.inkX,
        y: crop.y + ink.inkY,
        w: ink.inkW,
        h: ink.inkH,
      },
      erase: {
        x: crop.x + ink.inkX - Math.max(1, ink.inkH * 0.08),
        y: crop.y + ink.inkY - Math.max(1, ink.inkH * 0.1),
        w: ink.inkW + Math.max(2, ink.inkH * 0.16),
        h: ink.inkH + Math.max(2, ink.inkH * 0.2),
      },
      baselineY: crop.y + ink.baseline + fit.dy,
      leftX: crop.x + ink.inkX + fit.dx,
      fontId: fit.fontId,
      fontSize: fit.size,
      bold: fit.bold,
      italic: fit.italic,
      color: ink.fg,
      xScale: fit.xScale,
      confidence: line.confidence,
      matchScore: fit.score,
    });

    if (i % 8 === 0) {
      onProgress({
        status: "Identifying the fonts…",
        progress: 0.78 + (i / pending.length) * 0.2,
      });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress({ status: "Done", progress: 1 });
  return regions;
}

/** Draw one region's (possibly edited) text onto an already-inpainted canvas. */
export function drawRegionText(
  ctx: CanvasRenderingContext2D,
  region: TextRegion
) {
  const font = fontById(region.fontId);
  const text = region.text;
  if (!text) return;

  ctx.save();
  ctx.font = `${region.italic && font.hasItalic ? "italic " : ""}${
    region.bold ? "700" : "400"
  } ${region.fontSize}px ${font.family}`;
  ctx.fillStyle = region.color;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const fakeItalic = region.italic && !font.hasItalic;
  ctx.translate(region.leftX, region.baselineY);
  ctx.scale(region.xScale, 1);
  if (fakeItalic) ctx.transform(1, 0, -Math.tan(0.23), 1, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Recompose the whole image from the pristine original: erase every edited
 * region and redraw it. Never operates on its own previous output, so edits
 * can't accumulate artefacts.
 */
export function composite(
  target: HTMLCanvasElement,
  original: HTMLCanvasElement,
  regions: TextRegion[]
) {
  // The canvas element is remounted when the editor switches phases, which
  // resets it to the default 300x150. Always re-assert the real size before
  // drawing, otherwise both the preview and the download come out cropped.
  if (target.width !== original.width || target.height !== original.height) {
    target.width = original.width;
    target.height = original.height;
  }
  const ctx = target.getContext("2d", { willReadFrequently: true })!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(original, 0, 0);

  const dirty = regions.filter((r) => r.edited);
  for (const r of dirty) inpaintBox(ctx, r.erase);
  for (const r of dirty) drawRegionText(ctx, r);
}

/** Make sure every font we might draw with is actually loaded into the page. */
export async function preloadEditFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  const jobs: Promise<unknown>[] = [];
  for (const f of EDIT_FONTS) {
    for (const weight of ["400", "700"]) {
      jobs.push(document.fonts.load(`${weight} 64px ${f.family}`).catch(() => {}));
      if (f.hasItalic) {
        jobs.push(
          document.fonts.load(`italic ${weight} 64px ${f.family}`).catch(() => {})
        );
      }
    }
  }
  await Promise.all(jobs);
  await document.fonts.ready;
}
