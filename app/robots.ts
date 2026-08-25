import type { MetadataRoute } from "next"
import { LINKS } from "@/lib/links"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${LINKS.site.base}/sitemap.xml`,
  }
}
