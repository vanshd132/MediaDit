import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") || "mediadit.com";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const baseUrl = isLocal ? `http://${host}` : "https://mediadit.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
