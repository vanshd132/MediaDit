import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Text in an Image Online | MediaDit",
  description:
    "Change the text that is already inside a photo or screenshot. MediaDit reads the text, rebuilds the background behind it and matches the original font, size and colour so the edit is invisible. Free and 100% in your browser.",
  keywords: [
    "Edit Text in Image Free",
    "Change Text in Photo Online",
    "Replace Text in Screenshot",
    "Remove Text From Image",
    "Image Text Editor Online",
    "Edit Words in Picture",
    "Photo Text Replacement Tool",
    "Free OCR Text Editor Image",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
