import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider } from "@/components/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mediadit.com"),
  title: "MediaDit | Free Online Image Tools & Background Remover",
  description: "Free, serverless client-side image editor. Remove backgrounds with AI, edit text in images, add text, resize, crop, and convert images instantly with complete privacy.",
  keywords: [
    "Free Online Photo Editor",
    "Remove Background Instantly",
    "Edit Text in Image Free",
    "Add Text to Image Online",
    "Client-Side Background Remover",
    "Image Converter PNG to WEBP",
    "Crop and Resize Images Free",
    "Offline Photo Editor",
    "No Watermark Background Remover"
  ],
  openGraph: {
    title: "MediaDit | Free Online Image Tools",
    description: "Remove background, edit text in images, add text, crop, resize, and convert images. 100% offline, free, and secure.",
    url: "https://mediadit.com",
    siteName: "MediaDit",
    type: "website",
  },
  verification: {
    other: {
      "msvalidate.01": "A2925BB0F67E06574E6C433863C8EC1F",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
