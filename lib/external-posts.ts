import Parser from "rss-parser"

export type ExternalSource = "medium" | "substack"

export interface ExternalPost {
  id: string
  title: string
  excerpt: string
  date: string
  url: string
  image: string | null
  source: ExternalSource
}

interface FeedItem {
  title?: string
  contentSnippet?: string
  link?: string
  pubDate?: string
  isoDate?: string
  content?: string
  guid?: string
  [key: string]: unknown
}

const parser: Parser<unknown, FeedItem> = new Parser()

export const EXTERNAL_HOMES: Record<ExternalSource, (handle: string) => string> = {
  medium: (handle) => `https://medium.com/@${handle}`,
  substack: (handle) => `https://substack.com/@${handle}`,
}

export async function getExternalPosts(
  source: ExternalSource,
  handle: string,
): Promise<ExternalPost[]> {
  if (source === "substack") return getSubstackPosts(handle)
  return getMediumPosts(handle)
}

async function getMediumPosts(handle: string): Promise<ExternalPost[]> {
  try {
    const feed = await parser.parseURL(`https://medium.com/feed/@${handle}`)
    return (feed.items || []).map((item, index) => mapMediumItem(item, index))
  } catch {
    return []
  }
}

function mapMediumItem(item: FeedItem, index: number): ExternalPost {
  const contentHtml = (item["content:encoded"] as string | undefined) || item.content || ""
  const baseText = (item.contentSnippet && item.contentSnippet.trim()) || stripHtml(contentHtml)
  const firstLine = getFirstNonEmptyLine(baseText)
  const excerpt = truncateWords(firstLine, 18)
  const iso = item.isoDate || item.pubDate || new Date().toISOString()
  const rawImage = extractFirstImage(contentHtml)
  const image = rawImage ? rawImage.replace(/\/max\/(\d+)\//, "/max/1024/") : null

  return {
    id: item.guid || item.link || `medium-${index}`,
    title: item.title || "Untitled",
    excerpt,
    date: new Date(iso).toISOString().split("T")[0],
    url: cleanMediumUrl(item.link) || "#",
    image,
    source: "medium",
  }
}

/**
 * Medium's RSS appends a `?source=rss-<feedId>------2` tracking param to
 * every link, which sometimes routes through a slow attribution layer and
 * 504s. Strip the query so links go straight to the canonical post URL.
 */
function cleanMediumUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    u.search = ""
    return u.toString()
  } catch {
    return url
  }
}

/**
 * Substack uses the public profile API instead of RSS so guest posts on
 * other publications (where the user is a contributor, not the publication
 * owner) also appear: their own RSS feed only contains posts they published
 * on their own subdomain.
 */
async function getSubstackPosts(handle: string): Promise<ExternalPost[]> {
  try {
    const profileRes = await fetch(
      `https://substack.com/api/v1/user/${encodeURIComponent(handle)}/public_profile`,
      { next: { revalidate: 600 } },
    )
    if (!profileRes.ok) return []
    const profile = (await profileRes.json()) as { id?: number }
    if (!profile.id) return []

    const postsRes = await fetch(
      `https://substack.com/api/v1/profile/posts?profile_user_id=${profile.id}`,
      { next: { revalidate: 600 } },
    )
    if (!postsRes.ok) return []
    const json = (await postsRes.json()) as { posts?: SubstackProfilePost[] }
    return (json.posts ?? []).map(mapSubstackPost)
  } catch {
    return []
  }
}

interface SubstackProfilePost {
  id: number
  title?: string
  subtitle?: string | null
  post_date?: string
  canonical_url?: string
  cover_image?: string | null
  slug?: string
}

function mapSubstackPost(post: SubstackProfilePost): ExternalPost {
  const iso = post.post_date || new Date().toISOString()
  return {
    id: String(post.id),
    title: post.title || "Untitled",
    excerpt: truncateWords((post.subtitle || "").trim(), 18),
    date: new Date(iso).toISOString().split("T")[0],
    url: post.canonical_url || "#",
    image: post.cover_image || null,
    source: "substack",
  }
}

function extractFirstImage(html: string): string | null {
  if (!html) return null
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["'][^>]*>/i)
  return match ? match[1] : null
}

function getFirstNonEmptyLine(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  return lines[0] || text.trim()
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(" ") + "…"
}

export function formatExternalDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}
