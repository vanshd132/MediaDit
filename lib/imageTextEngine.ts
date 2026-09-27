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

function scaledCopy(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  if (Math.abs(scale - 1) < 0.02) return source;
  const out = makeCanvas(source.width * scale, source.height * scale);
  const c = out.getContext("2d")!;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

/** OCR every line in the image; boxes come back in `source` pixel coordinates. */
async function ocrLines(
  source: HTMLCanvasElement,
  onProgress: (p: AnalyzeProgress) => void
): Promise<TessLine[]> {
  const { createWorker, PSM } = await import("tesseract.js");

  // Upscaling small images helps OCR with small glyphs, but it hurts large
  // text: adaptive thresholding works in fixed-size pixel windows, which stop
  // spanning a whole letter once the letter is blown up. So read at both the
  // native size and the upscaled size.
  const minDim = Math.min(source.width, source.height);
  const maxDim = Math.max(source.width, source.height);
  const nativeScale = Math.min(1, OCR_MAX_DIM / maxDim);
  let upScale = nativeScale;
  if (minDim < OCR_TARGET_MIN_DIM) upScale = OCR_TARGET_MIN_DIM / minDim;
  if (maxDim * upScale > OCR_MAX_DIM) upScale = OCR_MAX_DIM / maxDim;
  upScale = clamp(upScale, 0.35, 3);
  const native = scaledCopy(source, nativeScale);
  const upscaled = upScale / nativeScale > 1.15 ? scaledCopy(source, upScale) : null;

  // One binarisation never suits every photo either. Tesseract's default global
  // Otsu threshold loses light text on gradients (white words over a sunset,
  // where half the sky is as bright as the letters); adaptive Otsu handles that
  // but can fragment clean scans; sparse mode finds isolated words (captions,
  // signatures) that page segmentation drops. Run several and merge, so each
  // pass covers the others' blind spots.
  type Pass = { img: HTMLCanvasElement; scale: number; thresh: string; psm: string; sparse: boolean };
  const passes: Pass[] = [
    { img: native, scale: nativeScale, thresh: "1", psm: PSM.AUTO, sparse: false },
    { img: native, scale: nativeScale, thresh: "1", psm: PSM.SPARSE_TEXT, sparse: true },
  ];
  if (upscaled) {
    passes.push(
      { img: upscaled, scale: upScale, thresh: "0", psm: PSM.AUTO, sparse: false },
      { img: upscaled, scale: upScale, thresh: "1", psm: PSM.AUTO, sparse: false }
    );
  } else {
    passes.push({ img: native, scale: nativeScale, thresh: "0", psm: PSM.AUTO, sparse: false });
  }

  const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 2;
  const poolSize = clamp(cores - 1, 1, 3);
  const passProgress = passes.map(() => 0);
  const report = () =>
    onProgress({
      status: "Reading the text…",
      progress: 0.15 + (passProgress.reduce((a, b) => a + b, 0) / passes.length) * 0.5,
    });

  const currentPass: number[] = [];
  const makeWorker = (wi: number) =>
    createWorker("eng", 1, {
      workerPath: "/tesseract/worker.min.js",
      logger: (m) => {
        const pi = currentPass[wi];
        if (m.status === "recognizing text" && pi !== undefined) {
          passProgress[pi] = m.progress;
          report();
        } else if (m.status.includes("loading") || m.status.includes("initializ")) {
          onProgress({ status: "Loading the OCR engine…", progress: 0.05 });
        }
      },
    });

  // First worker alone so the language data is fetched & cached once, then the
  // rest start from cache.
  onProgress({ status: "Loading the OCR engine…", progress: 0.05 });
  const workers = [await makeWorker(0)];
  try {
    if (poolSize > 1) {
      workers.push(...(await Promise.all(Array.from({ length: poolSize - 1 }, (_, i) => makeWorker(i + 1)))));
    }

    const results: { lines: TessLine[]; sparse: boolean }[] = [];
    let next = 0;
    await Promise.all(
      workers.map(async (worker, wi) => {
        while (next < passes.length) {
          const i = next++;
          currentPass[wi] = i;
          const pass = passes[i];
          await worker.setParameters({
            tessedit_pageseg_mode: pass.psm as never,
            thresholding_method: pass.thresh,
          } as never);
          const { data } = await worker.recognize(pass.img, {}, { blocks: true, text: false });
          const inv = 1 / pass.scale;
          const lines: TessLine[] = [];
          for (const block of data.blocks || []) {
            for (const para of block.paragraphs || []) {
              for (const line of para.lines || []) {
                // OCR tacks stray symbol "words" onto line ends (an image edge
                // read as "|", a dash as "="); they carry no editable text but
                // stretch the box over background. Trim them word by word.
                const words = (line.words || []).filter((w) => (w.text || "").trim());
                let a = 0;
                let z = words.length - 1;
                while (a <= z && !alnumCount(words[a].text)) a++;
                while (z >= a && !alnumCount(words[z].text)) z--;
                let text: string;
                let conf = line.confidence;
                let b = line.bbox;
                if (words.length && a <= z) {
                  const kept = words.slice(a, z + 1);
                  text = kept.map((w) => w.text.trim()).join(" ");
                  if (a > 0 || z < words.length - 1) {
                    conf = kept.reduce((s, w) => s + w.confidence, 0) / kept.length;
                    b = {
                      x0: Math.min(...kept.map((w) => w.bbox.x0)),
                      y0: Math.min(...kept.map((w) => w.bbox.y0)),
                      x1: Math.max(...kept.map((w) => w.bbox.x1)),
                      y1: Math.max(...kept.map((w) => w.bbox.y1)),
                    };
                  }
                } else {
                  text = (line.text || "").replace(/\s+/g, " ").trim();
                }
                if (!text) continue;
                lines.push({
                  text,
                  confidence: conf,
                  bbox: { x0: b.x0 * inv, y0: b.y0 * inv, x1: b.x1 * inv, y1: b.y1 * inv },
                });
              }
            }
          }
          results[i] = { lines, sparse: pass.sparse };
          passProgress[i] = 1;
          report();
        }
      })
    );

    return mergeOcrPasses(results);
  } finally {
    await Promise.all(workers.map((w) => w.terminate()));
  }
}

const alnumCount = (s: string) => (s.match(/[\p{L}\p{N}]/gu) || []).length;

/**
 * Combine lines from several OCR passes. The same line usually comes back from
 * more than one pass - sometimes whole, sometimes fragmented ("TR" + "NO
 * REGRET") - so rank every candidate by confidence x amount of real text and
 * greedily keep the best one for each patch of the image.
 */
function mergeOcrPasses(passes: { lines: TessLine[]; sparse: boolean }[]): TessLine[] {
  const cands: { line: TessLine; score: number }[] = [];
  for (const pass of passes) {
    for (const line of pass.lines) {
      const n = alnumCount(line.text);
      if (n === 0) continue;
      if (n === 1 && line.confidence < 85) continue;
      // sparse mode happily "reads" texture, so hold it to a higher bar; and
      // its boxes are looser, so on a tie prefer page segmentation's line
      if (pass.sparse && line.confidence < 60) continue;
      cands.push({ line, score: (line.confidence / 100) * n * (pass.sparse ? 0.9 : 1) });
    }
  }
  cands.sort((a, b) => b.score - a.score);

  const area = (b: TessLine["bbox"]) => Math.max(1, (b.x1 - b.x0) * (b.y1 - b.y0));
  const kept: TessLine[] = [];
  for (const { line } of cands) {
    const b = line.bbox;
    const clash = kept.some((k) => {
      const ix = Math.min(b.x1, k.bbox.x1) - Math.max(b.x0, k.bbox.x0);
      const iy = Math.min(b.y1, k.bbox.y1) - Math.max(b.y0, k.bbox.y0);
      if (ix <= 0 || iy <= 0) return false;
      return (ix * iy) / Math.min(area(b), area(k.bbox)) > 0.4;
    });
    if (!clash) kept.push(line);
  }
  // reading order
  return kept.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
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
  /** alpha (0-255) at which candidate renders match this scan's binarisation */
  alphaCut: number;
}

/**
 * Work out which pixels in a crop are glyph and which are page, plus the
 * colours involved. The background estimate deliberately only looks at the
 * *border* ring of the crop so glyph pixels can never pollute it.
 *
 * `inside` (crop coordinates) limits where ink may be found: the crop is
 * padded to see clean background, and on tightly set text that padding reaches
 * into the neighbouring lines, whose glyphs must not count as this line's.
 */
function measureInk(
  data: Uint8ClampedArray,
  cw: number,
  ch: number,
  inside?: { x0: number; y0: number; x1: number; y1: number }
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

  // Photos (sky, gradients) change colour across one line box, so compare each
  // pixel against a local background: per-row medians of the left and right
  // border strips, blended across the crop. A strip that is wildly off the
  // global estimate is probably a glyph touching the crop edge — ignore it.
  const sideBg = (x0: number): Float32Array => {
    const out = new Float32Array(ch * 3);
    const sw = Math.min(3, cw);
    for (let y = 0; y < ch; y++) {
      const r: number[] = [];
      const g: number[] = [];
      const b: number[] = [];
      for (let yy = Math.max(0, y - 3); yy <= Math.min(ch - 1, y + 3); yy++) {
        for (let k = 0; k < sw; k++) {
          const x = x0 < 0 ? cw - 1 - k : k;
          const i = (yy * cw + x) * 4;
          r.push(data[i]);
          g.push(data[i + 1]);
          b.push(data[i + 2]);
        }
      }
      out[y * 3] = median(r);
      out[y * 3 + 1] = median(g);
      out[y * 3 + 2] = median(b);
    }
    return out;
  };
  const leftBg = sideBg(0);
  const rightBg = sideBg(-1);
  for (let y = 0; y < ch; y++) {
    const q = y * 3;
    const dl = colorDist(leftBg[q], leftBg[q + 1], leftBg[q + 2], br, bg_, bb);
    const dr = colorDist(rightBg[q], rightBg[q + 1], rightBg[q + 2], br, bg_, bb);
    const lr = colorDist(leftBg[q], leftBg[q + 1], leftBg[q + 2], rightBg[q], rightBg[q + 1], rightBg[q + 2]);
    if (lr <= 110) continue;
    const [from, to] = dl > dr ? [rightBg, leftBg] : [leftBg, rightBg];
    to[q] = from[q];
    to[q + 1] = from[q + 1];
    to[q + 2] = from[q + 2];
  }

  // --- ink: everything far enough from the background ----------------------
  // Otsu-style threshold on the distance-from-background histogram.
  const dist = new Float32Array(cw * ch);
  let maxDist = 0;
  const ix0 = inside ? Math.max(0, Math.floor(inside.x0)) : 0;
  const iy0 = inside ? Math.max(0, Math.floor(inside.y0)) : 0;
  const ix1 = inside ? Math.min(cw - 1, Math.ceil(inside.x1)) : cw - 1;
  const iy1 = inside ? Math.min(ch - 1, Math.ceil(inside.y1)) : ch - 1;
  for (let p = 0; p < cw * ch; p++) {
    const x = p % cw;
    const y = (p / cw) | 0;
    if (x < ix0 || x > ix1 || y < iy0 || y > iy1) continue;
    const i = p * 4;
    const t = cw > 1 ? x / (cw - 1) : 0;
    const q = y * 3;
    const d = colorDist(
      data[i], data[i + 1], data[i + 2],
      leftBg[q] + (rightBg[q] - leftBg[q]) * t,
      leftBg[q + 1] + (rightBg[q + 1] - leftBg[q + 1]) * t,
      leftBg[q + 2] + (rightBg[q + 2] - leftBg[q + 2]) * t
    );
    dist[p] = d;
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 18) return null; // no real contrast -> not editable text

  const bins = 64;
  const hist = new Float64Array(bins);
  let total = 0;
  for (let y = iy0; y <= iy1; y++) {
    for (let x = ix0; x <= ix1; x++) {
      hist[Math.min(bins - 1, Math.floor((dist[y * cw + x] / maxDist) * bins))]++;
      total++;
    }
  }
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

  // OCR line boxes are sometimes bloated (they swallow sky/noise or reach
  // into the next line). Keep only the band of rows around the densest row,
  // stopping at a clear horizontal gap — the gap between two lines.
  const rowCnt = new Int32Array(ch);
  let peakRow = 0;
  for (let y = 0; y < ch; y++) {
    let c = 0;
    for (let x = 0; x < cw; x++) if (dist[y * cw + x] >= threshold) c++;
    rowCnt[y] = c;
    if (c > rowCnt[peakRow]) peakRow = y;
  }
  const rowMin = Math.max(1, rowCnt[peakRow] * 0.02);
  let bandTop = peakRow;
  let bandBot = peakRow;
  for (let dir = -1; dir <= 1; dir += 2) {
    let gap = 0;
    for (let y = peakRow + dir; y >= 0 && y < ch; y += dir) {
      if (rowCnt[y] >= rowMin) {
        if (dir < 0) bandTop = y;
        else bandBot = y;
        gap = 0;
      } else {
        const tol = Math.max(1, Math.round((bandBot - bandTop + 1) * 0.12));
        if (++gap > tol) break;
      }
    }
  }
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
  for (let y = bandTop; y <= bandBot; y++) {
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
  let cd = 0;
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p] || dist[p] < coreCut) continue;
    const i = p * 4;
    cr += data[i];
    cg += data[i + 1];
    cb += data[i + 2];
    cd += dist[p];
    cn++;
  }
  const coreDist = cn ? cd / cn : maxDist;
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
    // renders must be binarised at the same relative level as the scan, or a
    // candidate's strokes come out a pixel fatter or thinner than the real ones
    alphaCut: clamp(threshold / Math.max(threshold, coreDist), 0.2, 0.75) * 255,
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
/** Match score below which a line's font is searched for in the whole library
 *  rather than just the image-wide shortlist. The true face of a line scores
 *  0.75-1.0; a lookalike standing in for it typically scores 0.6-0.67. */
const WEAK_MATCH = 0.75;
/** Ink height above which lines are font-matched on a scaled-down copy. */
const MATCH_MAX_INK_H = 44;

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
  size: number,
  alphaCut = 96
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
    if (img.data[p * 4 + 3] > alphaCut) {
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
 * (ddx, ddy) nudge so the caller can hunt for the best placement.
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
  const overlap = inter / union;
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
  return overlap - 1.5 * strokePenalty - 0.8 * Math.min(1, capPenalty);
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
  const m = ctx.measureText(text);
  // ink extents, not advance width: side bearings and each face's own cap /
  // ascender height matter - thin serif strokes at text sizes lose most of
  // their overlap from a 2% size error
  const probeW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight || m.width;
  if (!probeW || !isFinite(probeW)) return null;
  const probeAscent = m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent : probe * 0.72;

  const byWidth = (ink.inkW / probeW) * probe;
  const byHeight = ((ink.baseline - ink.inkY) / probeAscent) * probe;
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
  let size = guessSize(text, ink, font, bold, italic);
  if (size === null) return null;
  let cand = renderCandidateMask(text, font, bold, italic, size, ink.alphaCut);
  if (!cand.count) return null;
  // Overlap is extremely peaky in size - thin strokes at text sizes go from a
  // perfect match to half that 1% off - so snap the size until the rendered
  // ink is exactly as wide as the original's. Every candidate gets its best
  // size before families are compared. (Short strings: width is unreliable.)
  if (text.replace(/[^A-Za-z0-9]/g, "").length > 3) {
    for (let it = 0; it < 2; it++) {
      const ratio = ink.inkW / Math.max(1, cand.x1 - cand.x0 + 1);
      if (Math.abs(ratio - 1) < 0.002 || ratio < 0.8 || ratio > 1.25) break;
      const next = renderCandidateMask(text, font, bold, italic, size * ratio, ink.alphaCut);
      if (!next.count) break;
      size *= ratio;
      cand = next;
    }
  }
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
    const cand = renderCandidateMask(text, font, best.bold, best.italic, size, ink.alphaCut);
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
  // single-weight faces (Anton, Bebas...) are heavy by design; a synthesized
  // bold on top of them never matches anything real
  if (!font.hasBold) return false;
  const probe = (bold: boolean) => {
    const c = renderCandidateMask(text, font, bold, fit.italic, fit.size, ink.alphaCut);
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
    const cand = renderCandidateMask(text, font, start.bold, start.italic, size, ink.alphaCut);
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
    for (const bold of font.hasBold ? boldGuesses : [false]) {
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
  // fetch the typefaces while OCR runs instead of before it
  const uprightFonts = preloadEditFonts();
  const lines = await ocrLines(source, onProgress);

  onProgress({ status: "Measuring the text…", progress: 0.7 });

  const sctx = source.getContext("2d", { willReadFrequently: true })!;

  interface Pending {
    line: TessLine;
    /** ink measured at full resolution - used for placement and erasing */
    ink: InkInfo;
    /** ink the font matcher works on (a downscaled copy for huge text) */
    mink: InkInfo;
    /** mink pixels per image pixel */
    mscale: number;
    crop: Box;
    text: string;
  }

  const pending: Pending[] = [];
  for (const line of lines) {
    if (line.confidence < MIN_CONFIDENCE) continue;
    if (pending.length >= MAX_REGIONS) break;

    const bx = line.bbox.x0;
    const by = line.bbox.y0;
    const bw = line.bbox.x1 - line.bbox.x0;
    const bh = line.bbox.y1 - line.bbox.y0;
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
    // OCR boxes are usually tight but can shave accents/descenders; allow a
    // little slack around them, never the full padding
    const slackX = bh * 0.15;
    const slackY = bh * 0.2;
    const inside = {
      x0: bx - cx - slackX,
      y0: by - cy - slackY,
      x1: bx + bw - cx + slackX,
      y1: by + bh - cy + slackY,
    };
    const ink = measureInk(crop.data, cw, ch, inside);
    if (!ink) continue;

    // Matching cost grows with glyph area and big poster text gains nothing
    // from the extra pixels, so fit very large lines on a scaled-down copy.
    let mink = ink;
    let mscale = 1;
    if (ink.inkH > MATCH_MAX_INK_H) {
      const s = MATCH_MAX_INK_H / ink.inkH;
      const full = makeCanvas(cw, ch);
      full.getContext("2d")!.putImageData(crop, 0, 0);
      const small = scaledCopy(full, s);
      const sd = small.getContext("2d", { willReadFrequently: true })!
        .getImageData(0, 0, small.width, small.height);
      const k = small.width / cw;
      const m = measureInk(sd.data, small.width, small.height, {
        x0: inside.x0 * k,
        y0: inside.y0 * k,
        x1: inside.x1 * k,
        y1: inside.y1 * k,
      });
      if (m) {
        mink = m;
        mscale = k;
      }
    }

    pending.push({ line, ink, mink, mscale, crop: { x: cx, y: cy, w: cw, h: ch }, text: line.text });
  }

  onProgress({ status: "Identifying the fonts…", progress: 0.78 });
  await uprightFonts;
  if (pending.some((p) => p.ink.slant > SLANT_THRESHOLD)) {
    await preloadEditFonts({ italic: true });
  }
  // Documents almost always use one or two typefaces. Elect the family on the
  // best few lines, then only trial the winners per line — much faster and far
  // more consistent than picking a different font for every line.
  const electors = pending
    .filter((p) => p.text.replace(/[^A-Za-z]/g, "").length >= 6)
    .sort((a, b) => b.mink.count - a.mink.count)
    .slice(0, 5);

  const tally = new Map<string, number>();
  for (const e of electors) {
    for (const font of EDIT_FONTS) {
      const fit = coarseFit(
        e.text,
        e.mink,
        font,
        font.hasBold && e.mink.boldness > BOLD_THRESHOLD,
        e.mink.slant > SLANT_THRESHOLD
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
  for (const [id] of ranked.slice(0, 5)) shortlistIds.add(id);
  const shortlist = [...shortlistIds].map(fontById);

  const regions: TextRegion[] = [];
  for (let i = 0; i < pending.length; i++) {
    const { ink, mink, mscale, crop, text, line } = pending[i];
    let found = bestFontFor(text, mink, shortlist);
    // Posters and designed images mix typefaces line by line (a Bebas
    // headline over a serif tagline), which the document-wide election can't
    // anticipate. If the shortlist can't reproduce this line well, try the
    // whole library for it, and let later lines reuse whatever wins.
    if (!found || found.score < WEAK_MATCH) {
      const others = EDIT_FONTS.filter((f) => !shortlistIds.has(f.id));
      const wide = bestFontFor(text, mink, others);
      if (wide && (!found || wide.score > found.score)) {
        found = wide;
        shortlistIds.add(wide.fontId);
        shortlist.push(fontById(wide.fontId));
      }
    }
    if (found && mscale !== 1) {
      found = { ...found, size: found.size / mscale, dx: found.dx / mscale, dy: found.dy / mscale };
    }
    const fit =
      found ||
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
  ctx.font = regionFontSpec(region);
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

/** The exact CSS font shorthand a region is drawn with. */
export function regionFontSpec(region: TextRegion, px = region.fontSize): string {
  const font = fontById(region.fontId);
  return `${region.italic && font.hasItalic ? "italic " : ""}${
    region.bold ? "700" : "400"
  } ${px}px ${font.family}`;
}

/** Load the faces the given regions need (no-op for ones already loaded). */
export async function ensureRegionFonts(regions: TextRegion[]) {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = new Set(regions.map((r) => regionFontSpec(r, 64)));
  await Promise.all([...specs].map((s) => document.fonts.load(s).catch(() => {})));
}

/**
 * Load the faces the matcher renders with. Upright faces are needed for every
 * image; italics (~40% of the bytes) only when some line actually slants.
 */
export async function preloadEditFonts(opts: { italic?: boolean } = {}) {
  if (typeof document === "undefined" || !document.fonts) return;
  const jobs: Promise<unknown>[] = [];
  for (const f of EDIT_FONTS) {
    const weights = f.hasBold ? ["400", "700"] : ["400"];
    for (const weight of weights) {
      if (opts.italic) {
        if (f.hasItalic) {
          jobs.push(document.fonts.load(`italic ${weight} 64px ${f.family}`).catch(() => {}));
        }
      } else {
        jobs.push(document.fonts.load(`${weight} 64px ${f.family}`).catch(() => {}));
      }
    }
  }
  await Promise.all(jobs);
}
