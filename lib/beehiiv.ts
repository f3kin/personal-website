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
  const params = new URLSearchParams({
    "status[]": "confirmed",
    "expand[]": "free_web_content",
    order_by: "publish_date",
    direction: "desc",
    limit: String(limit),
  })

  // Beehiiv uses `confirmed` for published; some accounts use `published`. Try confirmed first.
  let res = await fetch(`${API_BASE}/publications/${publicationId}/posts?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    next: { revalidate: 3600 }, // refresh hourly
  })

  if (!res.ok) {
    // Fall back to status=published if confirmed isn't recognised
    const fallback = new URLSearchParams(params)
    fallback.set("status[]", "published")
    res = await fetch(`${API_BASE}/publications/${publicationId}/posts?${fallback}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      next: { revalidate: 3600 },
    })
  }

  if (!res.ok) return []
  const json = (await res.json()) as ListPostsResponse
  const posts = json.data ?? []

  // Hide pre-relaunch Hourglass-branded issues. The newsletter relaunched as a
  // personal-brand publication in June 2026; everything before that ran under the
  // old "Hourglass Digital AI Newsletter" title and isn't part of the personal archive.
  return posts.filter((p) => !/^Hourglass Digital AI Newsletter/i.test(p.title))
}

export function formatPostDate(post: BeehiivPost): string {
  const ts = post.displayed_date ?? post.publish_date
  const date = ts ? new Date(ts * 1000) : post.scheduled_at ? new Date(post.scheduled_at) : null
  if (!date) return ""
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
}
