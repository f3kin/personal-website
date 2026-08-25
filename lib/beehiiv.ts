// Beehiiv API v2 client. Server-side only  -  never expose the API key to the browser.
// Docs: https://developers.beehiiv.com/api-reference

import sanitizeHtml from "sanitize-html"

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

  // No CSS-property cleanup needed any more: we strip `style` entirely below.
  // .post-content CSS in globals.css governs spacing/layout/typography.

  // Pure-JS allowlist sanitiser (no jsdom  -  works on Vercel serverless).
  const clean = sanitizeHtml(out, {
    allowedTags: [
      "div", "span", "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "a", "img", "figure", "figcaption",
      "ul", "ol", "li",
      "blockquote", "code", "pre",
      "strong", "em", "b", "i", "u", "s", "mark", "small", "sub", "sup",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title", "id", "class"],
      img: [
        "src", "srcset", "alt", "width", "height",
        "loading", "decoding", "fetchpriority",
        "id", "class",
      ],
      "*": ["id", "class", "title"],
    },
    // https only for http(s); explicit list keeps protocol-relative // URLs out.
    allowedSchemes: ["https", "mailto", "tel"],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      // Enforce rel="noopener noreferrer" on every target="_blank" link.
      a: (tagName, attribs) => {
        if (attribs.target === "_blank") {
          attribs.rel = "noopener noreferrer"
        }
        return { tagName, attribs }
      },
    },
  })

  return clean
}

/**
 * Pull the first <img> URL out of the sanitised post HTML and return it
 * separately, so the page can render it as a Next/Image hero (edge-cached,
 * WebP-converted, correctly sized) and Next can automatically preload it.
 *
 * Beehiiv's first body image is always the post's hero. Doing this avoids:
 * - Preloading a different URL than the body actually loads (S3 vs cdn-cgi)
 * - Skipping Next/Image optimisation on the most-visible image on the page
 * - Loading the same image twice (once as preload, once as body img)
 */
export function extractHeroFromHtml(html: string): { heroUrl: string | null; html: string } {
  const match = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)
  if (!match) return { heroUrl: null, html }
  const stripped = html.replace(match[0], "")
  return { heroUrl: match[1], html: stripped }
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

  const res = await fetch(
    `${API_BASE}/publications/${publicationId}/posts?${params}`,
    {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      next: { revalidate: 300 },
    },
  )

  if (!res.ok) return []
  const json = (await res.json()) as ListPostsResponse
  const posts = json.data ?? []

  // Beehiiv's `status[]` query param is unreliable: drafts come back even when
  // only `confirmed` is requested (observed 2026-06-11). Filter here instead,
  // and require a publish_date in the past so scheduled-but-unsent posts
  // (status `confirmed`, future publish_date) don't appear before send time.
  const now = Math.floor(Date.now() / 1000)
  return posts.filter(
    (p) =>
      p.status !== "draft" &&
      typeof p.publish_date === "number" &&
      p.publish_date <= now &&
      // Hide pre-relaunch Hourglass-branded issues. The newsletter relaunched as a
      // personal-brand publication in June 2026; everything before that ran under the
      // old "Hourglass Digital AI Newsletter" title and isn't part of the personal archive.
      !/^Hourglass Digital AI Newsletter/i.test(p.title),
  )
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
  // If the detail fetch fails, return the list-item shell so the page can still
  // render the title/header  -  body will fall through to the "available on the
  // newsletter site" notice instead of rendering an empty page.
  if (!res.ok) return match
  const json = (await res.json()) as { data: BeehiivPost }
  // Preserve list-item fields if the detail response is incomplete.
  return { ...match, ...(json.data ?? {}) }
}

export type SubscribeResult =
  | { ok: true; status: "active" | "pending" | "validating" | string }
  | { ok: false; error: string; kind: "validation" | "upstream" }

/** Where a signup came from, read off the landing URL's query string. */
export type SubscriptionAttribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referring_site?: string
}

// Beehiiv treats UTM values as case-sensitive and does not infer them for API
// signups, so normalise here rather than trusting whatever the link carried.
const clean = (v: string | undefined, max = 100) =>
  v?.trim().toLowerCase().slice(0, max) || undefined

/**
 * Create a subscription on the publication. Beehiiv's double-opt-in / welcome
 * email behaviour depends on the publication's dashboard settings.
 *
 * Attribution comes from the visitor's own UTM parameters. Falling back to
 * "website" rather than a fixed hostname keeps tagged traffic (x, linkedin)
 * distinguishable in Beehiiv's acquisition report.
 */
export async function createSubscription(
  email: string,
  attribution: SubscriptionAttribution = {},
): Promise<SubscribeResult> {
  const { apiKey, publicationId } = getEnv()
  if (!apiKey || !publicationId) {
    return { ok: false, kind: "upstream", error: "Subscribe is temporarily unavailable." }
  }

  try {
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
        utm_source: clean(attribution.utm_source) ?? "website",
        utm_medium: clean(attribution.utm_medium) ?? "subscribe-form",
        utm_campaign: clean(attribution.utm_campaign) ?? "finlayekins.com",
        ...(attribution.referring_site
          ? { referring_site: clean(attribution.referring_site, 255) }
          : {}),
      }),
    })

    if (!res.ok) {
      // Log the raw upstream response server-side; return a safe generic message
      // so we don't expose internals or vary copy by Beehiiv's HTTP status.
      const text = await res.text().catch(() => "")
      console.error("[beehiiv] subscribe failed", res.status, text)
      if (res.status === 400 || res.status === 422) {
        return {
          ok: false,
          kind: "validation",
          error: "That email doesn't look right. Try again?",
        }
      }
      return {
        ok: false,
        kind: "upstream",
        error: "Subscribe is temporarily unavailable. Try again in a moment?",
      }
    }
    const json = (await res.json().catch(() => null)) as
      | { data?: { status?: string } }
      | null
    return { ok: true, status: json?.data?.status ?? "pending" }
  } catch (err) {
    console.error("[beehiiv] subscribe network error", err)
    return {
      ok: false,
      kind: "upstream",
      error: "Subscribe is temporarily unavailable. Try again in a moment?",
    }
  }
}

export function formatPostDate(post: BeehiivPost): string {
  const ts = post.displayed_date ?? post.publish_date
  const date = ts ? new Date(ts * 1000) : post.scheduled_at ? new Date(post.scheduled_at) : null
  if (!date) return ""
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
}
