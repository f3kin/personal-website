import type { MetadataRoute } from "next"
import { listPublishedPosts, slugFromWebUrl } from "@/lib/beehiiv"
import { LINKS } from "@/lib/links"

export const revalidate = 3600

const base = LINKS.site.base

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/newsletter`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/writing`, changeFrequency: "weekly", priority: 0.8 },
  ]

  // Issue pages come from beehiiv, so a failed fetch must not take the whole
  // sitemap down with it.
  let issues: MetadataRoute.Sitemap = []
  try {
    const posts = await listPublishedPosts({ limit: 100 })
    issues = posts.flatMap((post) => {
      const slug = slugFromWebUrl(post.web_url)
      if (!slug) return []
      const published = post.publish_date ? new Date(post.publish_date * 1000) : undefined
      return [
        {
          url: `${base}/writing/${slug}`,
          lastModified: published,
          changeFrequency: "yearly" as const,
          priority: 0.6,
        },
      ]
    })
  } catch {
    // fall through with the static routes only
  }

  return [...staticRoutes, ...issues]
}
