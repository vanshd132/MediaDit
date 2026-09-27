import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("host") || "mediadit.com";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const baseUrl = isLocal ? `http://${host}` : "https://mediadit.com";

  const baseRoutes = [
    "",
    "/remove-background",
    "/edit-text",
    "/add-text",
    "/convert",
    "/resize",
    "/compress",
    "/privacy-policy",
  ];
  const languages = ["en", "es", "fr", "de", "pt", "hi"];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of baseRoutes) {
    for (const lang of languages) {
      // Keep English routes as the root paths, append parameter for alternative languages
      const url = `${baseUrl}${route}${lang === "en" ? "" : `?lang=${lang}`}`;

      let priority = 0.75;
      let changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly";

      if (route === "/privacy-policy") {
        priority = lang === "en" ? 0.3 : 0.2;
        changeFrequency = "yearly";
      } else if (route === "" || route === "/remove-background" || route === "/edit-text") {
        priority = lang === "en" ? 1.0 : 0.85;
        changeFrequency = "daily";
      } else {
        priority = lang === "en" ? 0.9 : 0.75;
        changeFrequency = "weekly";
      }

      entries.push({
        url,
        lastModified: new Date().toISOString(),
        changeFrequency,
        priority,
      });
    }
  }

  return entries;
}
