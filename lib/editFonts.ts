export type FontClass = "sans" | "serif" | "mono" | "display";

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
 * The actual WOFF2 files are self-hosted under /public/fonts (see
 * scripts/fetch-edit-fonts.mjs) and declared in app/edit-fonts.css, so nothing
 * is requested from a third party at runtime.
 */
export const EDIT_FONTS: EditFont[] = [
  { id: "arimo", label: "Arial / Helvetica (Arimo)", family: '"MD Arimo"', cls: "sans", hasItalic: true },
  { id: "tinos", label: "Times New Roman (Tinos)", family: '"MD Tinos"', cls: "serif", hasItalic: true },
  { id: "cousine", label: "Courier New (Cousine)", family: '"MD Cousine"', cls: "mono", hasItalic: true },
  { id: "carlito", label: "Calibri (Carlito)", family: '"MD Carlito"', cls: "sans", hasItalic: true },
  { id: "caladea", label: "Cambria (Caladea)", family: '"MD Caladea"', cls: "serif", hasItalic: true },
  { id: "roboto", label: "Roboto", family: '"MD Roboto"', cls: "sans", hasItalic: true },
  { id: "opensans", label: "Open Sans", family: '"MD Open Sans"', cls: "sans", hasItalic: true },
  { id: "lato", label: "Lato", family: '"MD Lato"', cls: "sans", hasItalic: true },
  { id: "sourcesans", label: "Source Sans", family: '"MD Source Sans 3"', cls: "sans", hasItalic: true },
  { id: "notosans", label: "Noto Sans", family: '"MD Noto Sans"', cls: "sans", hasItalic: true },
  { id: "montserrat", label: "Montserrat", family: '"MD Montserrat"', cls: "sans", hasItalic: true },
  { id: "poppins", label: "Poppins", family: '"MD Poppins"', cls: "sans", hasItalic: true },
  { id: "raleway", label: "Raleway", family: '"MD Raleway"', cls: "sans", hasItalic: true },
  { id: "nunito", label: "Nunito", family: '"MD Nunito"', cls: "sans", hasItalic: true },
  { id: "oswald", label: "Oswald (condensed)", family: '"MD Oswald"', cls: "display", hasItalic: false },
  { id: "merriweather", label: "Merriweather", family: '"MD Merriweather"', cls: "serif", hasItalic: true },
  { id: "playfair", label: "Playfair Display", family: '"MD Playfair Display"', cls: "serif", hasItalic: true },
  { id: "ptserif", label: "PT Serif", family: '"MD PT Serif"', cls: "serif", hasItalic: true },
  { id: "lora", label: "Lora", family: '"MD Lora"', cls: "serif", hasItalic: true },
  { id: "robotomono", label: "Roboto Mono", family: '"MD Roboto Mono"', cls: "mono", hasItalic: true },
];

export const fontById = (id: string): EditFont =>
  EDIT_FONTS.find((f) => f.id === id) || EDIT_FONTS[0];
