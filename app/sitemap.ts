import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("host") || "mediadit.com";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const baseRoutes = ["", "/remove-background", "/edit-text", "/add-text", "/convert", "/resize", "/compress", "/privacy-policy"];
  const languages = ["en", "es", "fr", "de", "pt", "hi"];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of baseRoutes) {
    for (const lang of languages) {
      // Keep English routes as the root paths, append parameter for alternative languages
      const url = `${baseUrl}${route}${lang === "en" ? "" : `?lang=${lang}`}`;
      entries.push({
        url,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly",
        priority: (route === "" || route === "/remove-background") && lang === "en" ? 1.0 : 0.7,
      });
    }
  }

  return entries;
}
