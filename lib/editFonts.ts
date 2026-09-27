export type FontClass = "sans" | "serif" | "mono" | "display" | "script";

export interface EditFont {
  /** stable id used in state */
  id: string;
  /** what the user sees in the dropdown */
  label: string;
  /** CSS font-family string, handed straight to `ctx.font` */
  family: string;
  /** broad classification */
  cls: FontClass;
  /** true when the family ships real italic outlines */
  hasItalic: boolean;
  /** true when the family ships a real 700 weight (display faces often don't) */
  hasBold: boolean;
}

/**
 * Typefaces used to re-draw edited text on top of a photo.
 *
 * Arimo / Tinos / Cousine / Carlito / Caladea are *metric compatible* clones of
 * Arial (and therefore Helvetica / San Francisco to a close approximation),
 * Times New Roman, Courier New, Calibri and Cambria respectively. Because their
 * advance widths match the originals glyph for glyph, re-typed text lands on
 * very nearly the same pixels as the text it replaces - which is the main
 * reason the result doesn't read as edited.
 *
 * The list lives in scripts/edit-fonts.list.mjs; the fetch script downloads the
 * WOFF2 files to /public/fonts, declares them in app/edit-fonts.css and writes
 * which variants each family really has to editFonts.generated.ts. Nothing is
 * requested from a third party at runtime.
 */
import { GENERATED_FONTS } from "./editFonts.generated";

export const EDIT_FONTS: EditFont[] = GENERATED_FONTS;

export const FONT_CLASS_LABELS: Record<FontClass, string> = {
  sans: "Sans-serif",
  serif: "Serif",
  display: "Display / Poster",
  mono: "Monospace",
  script: "Script",
};

export const fontById = (id: string): EditFont =>
  EDIT_FONTS.find((f) => f.id === id) || EDIT_FONTS[0];
