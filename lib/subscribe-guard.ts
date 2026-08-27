/**
 * Bot protection for the newsletter subscribe form.
 *
 * Layered and deliberately cheap: a honeypot field, a submit-timing check, a
 * per-IP rate limit, and a small set of server-side address heuristics. No
 * third-party captcha, because on a personal site the conversion rate matters
 * more than perfect filtering.
 *
 * Every check here is a trade against false positives: a rejected real person
 * silently never subscribes and never tells us. Where a rule is arguable it is
 * tuned to let borderline addresses through.
 */

/** Minimum time between form mount and submit. Bots post instantly. */
export const MIN_SUBMIT_MS = 2000

/** Per-IP allowance: this many accepted attempts inside the window. */
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
/** Hard cap on tracked IPs so a flood cannot grow the map without bound. */
const RATE_LIMIT_MAX_KEYS = 5000

export type RejectionReason =
  | "honeypot"
  | "too_fast"
  | "rate_limited"
  | "disposable_domain"
  | "obfuscated_local_part"

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: RejectionReason; status: number; error: string }

/**
 * Known throwaway-mail providers. Kept short and high-confidence on purpose:
 * a long scraped list goes stale and starts catching real addresses. These are
 * services whose entire product is a mailbox that disappears.
 */
const DISPOSABLE_DOMAINS = new Set([
  "0-mail.com",
  "10minutemail.com",
  "20minutemail.com",
  "33mail.com",
  "anonbox.net",
  "dispostable.com",
  "e4ward.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "inboxbear.com",
  "jetable.org",
  "mail-temporaire.fr",
  "mail7.io",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "nowmymail.com",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempail.com",
  "tempinbox.com",
  "tempmail.net",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "trbvm.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
])

/** Gmail ignores dots in the local part entirely, so heavy dotting is only ever
 * used to mint many distinct-looking addresses from one mailbox. Four or more
 * is the threshold: real people occasionally write first.middle.last.surname,
 * but not first.n.a.m.e patterns. */
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"])
const MAX_GMAIL_DOTS = 3

function splitEmail(email: string): { local: string; domain: string } {
  const at = email.lastIndexOf("@")
  if (at < 0) return { local: email, domain: "" }
  return { local: email.slice(0, at), domain: email.slice(at + 1) }
}

export function isDisposableDomain(email: string): boolean {
  return DISPOSABLE_DOMAINS.has(splitEmail(email).domain)
}

export function hasObfuscatedLocalPart(email: string): boolean {
  const { local, domain } = splitEmail(email)
  if (!GMAIL_DOMAINS.has(domain)) return false
  // Gmail strips a +tag before delivery; judge only the part it actually keys on.
  const base = local.split("+")[0]
  const dots = (base.match(/\./g) ?? []).length
  return dots > MAX_GMAIL_DOTS
}

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/** Drop expired entries, then the oldest keys, so the map stays bounded. */
function evict(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  // Map iterates in insertion order, so the first keys are the least recent.
  while (buckets.size > RATE_LIMIT_MAX_KEYS) {
    const oldest = buckets.keys().next()
    if (oldest.done) break
    buckets.delete(oldest.value)
  }
}

/**
 * Vercel puts the real client IP first in x-forwarded-for. Fall back to
 * x-real-ip, then to a shared bucket so a request with no IP header still
 * counts against something rather than bypassing the limit entirely.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const first = forwarded?.split(",")[0]?.trim()
  if (first) return first
  return req.headers.get("x-real-ip")?.trim() || "unknown"
}

export function checkRateLimit(ip: string, now = Date.now()): boolean {
  evict(now)
  const bucket = buckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  bucket.count += 1
  // Refresh recency so an active IP is not evicted while it is being limited.
  buckets.delete(ip)
  buckets.set(ip, bucket)
  return bucket.count <= RATE_LIMIT_MAX
}

/** Test seam: the rate-limit map is module state and outlives a single request. */
export function resetRateLimit() {
  buckets.clear()
}

/**
 * Log a rejection with enough detail to judge later whether the filters are
 * working, and no more. The address itself never lands in the logs: the domain
 * is what tells us whether a rule is misfiring, and the local part is the part
 * that identifies a person.
 */
export function logRejection(reason: RejectionReason, email: string, ip: string) {
  console.warn(
    JSON.stringify({
      evt: "subscribe_rejected",
      reason,
      domain: splitEmail(email).domain || null,
      // Truncated so the log groups repeat offenders without storing full addresses.
      ip: ip.slice(0, 20),
      ts: new Date().toISOString(),
    }),
  )
}

export type GuardInput = {
  email: string
  honeypot: unknown
  elapsedMs: unknown
  ip: string
}

/**
 * Run every check in cheapest-first order. Rejections that indicate a bot get a
 * generic "something went wrong" rather than an explanation, so a bot author
 * cannot read which rule caught them; a rate-limited human gets copy that tells
 * them to wait, since that is the one case a real person hits.
 */
export function guardSubscription(input: GuardInput): GuardResult {
  const { email, honeypot, elapsedMs, ip } = input

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    logRejection("honeypot", email, ip)
    return { ok: false, reason: "honeypot", status: 400, error: "Something went wrong. Try again?" }
  }

  // Only judge timing when the client actually sent it. A missing value means a
  // scripted post or a stale cached bundle, and rejecting the stale bundle would
  // break real signups for anyone holding the page open across a deploy.
  if (typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs < MIN_SUBMIT_MS) {
    logRejection("too_fast", email, ip)
    return { ok: false, reason: "too_fast", status: 400, error: "Something went wrong. Try again?" }
  }

  if (!checkRateLimit(ip)) {
    logRejection("rate_limited", email, ip)
    return {
      ok: false,
      reason: "rate_limited",
      status: 429,
      error: "Too many attempts. Try again in a few minutes.",
    }
  }

  if (isDisposableDomain(email)) {
    logRejection("disposable_domain", email, ip)
    return {
      ok: false,
      reason: "disposable_domain",
      status: 400,
      error: "Use a permanent email address so the newsletter can reach you.",
    }
  }

  if (hasObfuscatedLocalPart(email)) {
    logRejection("obfuscated_local_part", email, ip)
    return {
      ok: false,
      reason: "obfuscated_local_part",
      status: 400,
      error: "Something went wrong. Try again?",
    }
  }

  return { ok: true }
}
