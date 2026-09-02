/**
 * Rate limiting for the like button. Deliberately light: the main "one like
 * per visitor" rule lives in the database (a unique constraint on
 * (slug, visitor_id)), so this only needs to stop a single IP from hammering
 * the endpoint with fabricated visitor ids.
 */

import { createRateLimiter } from "@/lib/rate-limit"

const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const rateLimiter = createRateLimiter({ max: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS })

export function checkLikeRateLimit(ip: string, now?: number): boolean {
  return rateLimiter.check(ip, now)
}

/** Test seam: the rate-limit map is module state and outlives a single request. */
export function resetLikeRateLimit() {
  rateLimiter.reset()
}
