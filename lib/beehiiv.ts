// Beehiiv API v2 client. Server-side only  -  never expose the API key to the browser.
// Docs: https://developers.beehiiv.com/api-reference

export type BeehiivPost = {
  id: string
  title: string
  subtitle?: string | null
  status: string
  publish_date?: number | null // unix seconds
  displayed_date?: number | null // unix seconds
  scheduled_at?: string | null
  web_url?: string | null
  thumbnail_url?: string | null
  preview_text?: string | null
  authors?: string[]
  subject_line?: string | null
  email_settings?: { email_subject_line?: string | null } | null
  content?: {
    free?: {
      web?: string
      email?: string
      rss?: string
    }
  }
}

export function slugFromWebUrl(webUrl?: string | null): string | null {
  if (!webUrl) return null
  const match = webUrl.match(/\/p\/([^/?#]+)/)
  return match ? match[1] : null
}

/**
 * Beehiiv's `content.free.web` ships a full email-template HTML with:
 * - `<style>` blocks that redefine `:root` colours (dark background, white text)
 * - A `web-header` containing duplicate title + byline + share icons
 * - Aggressive inline `color: var(--wt-...) !important` rules that turn text white
 * - Heavy inline padding designed for fixed-width email rendering
 *
 * Strip the wrapper chrome and inline overrides so the body content can adopt
 * our site's typography and theme.
 */
export function sanitizeBeehiivHtml(html: string): string {
  let out = html

  // Drop embedded stylesheets, scripts, and font/preconnect links.
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "")
  out = out.replace(/<link[^>]*>/gi, "")
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "")

  // Remove Beehiiv's own header (title, subtitle, byline, share icons)  -  we render our own.
  out = out.replace(
    /<div[^>]*id=["']web-header["'][\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i,
    "",
  )
  // Some templates wrap the header differently  -  also strip byline standalone.
  out = out.replace(/<div[^>]*class=["'][^"']*bh__byline_wrapper[\s\S]*?<\/div>\s*<\/div>/i, "")
  // Strip the social share row that follows the byline (Facebook/X/Threads icons).
  out = out.replace(
    /<div[^>]*class=["'][^"']*bh__byline_social_wrapper[\s\S]*?<\/div>\s*(<\/a>\s*)?(?:<\/div>\s*){1,3}/i,
    "",
  )
  // Belt-and-braces: nuke any <a> wrapping a share-svg by hostname.
  out = out.replace(
    /<a[^>]*href=["'][^"']*(?:facebook\.com\/sharer|twitter\.com\/intent|threads\.net\/intent|linkedin\.com\/share)[^"']*["'][\s\S]*?<\/a>/gi,
    "",
  )

  // Strip outer max-width container so content fills our column.
  out = out.replace(/max-width:\s*672px;?/gi, "")

  // Reduce the universal 40px side padding (email convention) down to 0.
  out = out.replace(/padding-left:\s*40px;?/gi, "")
  out = out.replace(/padding-right:\s*40px;?/gi, "")

  // Kill inline colour + font-family rules so our CSS wins. Catches both the
  // hardcoded fallbacks and the `var(--wt-*) !important` overrides.
  out = out.replace(/color:\s*[^;"]+(?:\s*!important)?;?/gi, "")
  out = out.replace(/font-family:\s*[^;"]+(?:\s*!important)?;?/gi, "")
  out = out.replace(/background-color:\s*[^;"]+(?:\s*!important)?;?/gi, "")
  // Drop inline font-size + line-height; let our CSS handle scale.
  out = out.replace(/font-size:\s*[^;"]+(?:\s*!important)?;?/gi, "")
  out = out.replace(/line-height:\s*[^;"]+(?:\s*!important)?;?/gi, "")

  return out
}

type ListPostsResponse = {
  data: BeehiivPost[]
  page: number
  limit: number
  total_results: number
  total_pages: number
}

const API_BASE = "https://api.beehiiv.com/v2"

function getEnv() {
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID
  return { apiKey, publicationId }
}

/**
 * Fetch the latest published posts for the publication.
 * Returns an empty array (not an error) if env vars are missing or the API errors,
 * so the page can render a sensible empty/CTA state.
 */
export async function listPublishedPosts(opts: { limit?: number } = {}): Promise<BeehiivPost[]> {
  const { apiKey, publicationId } = getEnv()
  if (!apiKey || !publicationId) return []

  const limit = Math.min(opts.limit ?? 25, 100)
  // Pass both possible "live" statuses; Beehiiv accounts vary on which they return.
  const params = new URLSearchParams({
    "expand[]": "free_web_content",
    order_by: "publish_date",
    direction: "desc",
    limit: String(limit),
  })
  params.append("status[]", "confirmed")
  params.append("status[]", "published")

  const res = await fetch(`${API_BASE}/publications/${publicationId}/posts?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    next: { revalidate: 300 },
  })

  if (!res.ok) return []
  const json = (await res.json()) as ListPostsResponse
  const posts = json.data ?? []

  // Hide pre-relaunch Hourglass-branded issues. The newsletter relaunched as a
  // personal-brand publication in June 2026; everything before that ran under the
  // old "Hourglass Digital AI Newsletter" title and isn't part of the personal archive.
  return posts.filter((p) => !/^Hourglass Digital AI Newsletter/i.test(p.title))
}

/**
 * Fetch a single post by its slug (the segment after /p/ in Beehiiv's web_url).
 * Returns null if not found, not yet published, or env vars are missing.
 */
export async function getPostBySlug(slug: string): Promise<BeehiivPost | null> {
  const { apiKey, publicationId } = getEnv()
  if (!apiKey || !publicationId) return null

  // Beehiiv has no slug lookup; list and match. Hourly cache mirrors the list page.
  const posts = await listPublishedPosts({ limit: 100 })
  const match = posts.find((p) => slugFromWebUrl(p.web_url) === slug)
  if (!match) return null

  // Fetch full content for this post.
  const params = new URLSearchParams({ "expand[]": "free_web_content" })
  const res = await fetch(
    `${API_BASE}/publications/${publicationId}/posts/${match.id}?${params}`,
    {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      next: { revalidate: 3600 },
    },
  )
  if (!res.ok) return match
  const json = (await res.json()) as { data: BeehiivPost }
  return json.data ?? match
}

export type SubscribeResult =
  | { ok: true; status: "active" | "pending" | "validating" | string }
  | { ok: false; error: string }

/**
 * Create a subscription on the publication. Beehiiv's double-opt-in / welcome
 * email behaviour depends on the publication's dashboard settings.
 */
export async function createSubscription(email: string): Promise<SubscribeResult> {
  const { apiKey, publicationId } = getEnv()
  if (!apiKey || !publicationId) {
    return { ok: false, error: "Subscribe is temporarily unavailable." }
  }

  const res = await fetch(`${API_BASE}/publications/${publicationId}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: "finlayekins.com",
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return { ok: false, error: text || `Subscribe failed (${res.status}).` }
  }
  const json = (await res.json().catch(() => null)) as
    | { data?: { status?: string } }
    | null
  return { ok: true, status: json?.data?.status ?? "pending" }
}

export function formatPostDate(post: BeehiivPost): string {
  const ts = post.displayed_date ?? post.publish_date
  const date = ts ? new Date(ts * 1000) : post.scheduled_at ? new Date(post.scheduled_at) : null
  if (!date) return ""
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
}
