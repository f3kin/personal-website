/**
 * Validation and bot protection for the comment form. Reuses the exact
 * pattern shipped for the newsletter subscribe form (lib/subscribe-guard.ts):
 * a honeypot field, a submit-timing check, and a per-IP rate limit. Comments
 * have no email-domain heuristics since, unlike a subscribe address, the
 * email here is optional and never contacted.
 */

import { createRateLimiter } from "@/lib/rate-limit"

export const MIN_SUBMIT_MS = 2000
export const NAME_MAX = 80
export const BODY_MAX = 2000

/** Per-IP allowance: this many accepted comments inside the window. */
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const rateLimiter = createRateLimiter({ max: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS })

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ValidatedComment = { name: string; body: string; email?: string }

export type ValidationResult =
  | { ok: true; value: ValidatedComment }
  | { ok: false; error: string }

export function validateComment(input: {
  name: unknown
  email: unknown
  body: unknown
}): ValidationResult {
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const body = typeof input.body === "string" ? input.body.trim() : ""
  const email = typeof input.email === "string" ? input.email.trim() : ""

  if (!name) return { ok: false, error: "Enter your name." }
  if (name.length > NAME_MAX) return { ok: false, error: "Name is too long." }
  if (!body) return { ok: false, error: "Write a comment before posting." }
  if (body.length > BODY_MAX) return { ok: false, error: "Comment is too long." }
  if (email && !EMAIL.test(email)) {
    return { ok: false, error: "Enter a valid email address, or leave it blank." }
  }

  return { ok: true, value: { name, body, email: email || undefined } }
}

export type RejectionReason = "honeypot" | "too_fast" | "rate_limited" | "invalid"

export type GuardResult =
  | { ok: true; value: ValidatedComment }
  | { ok: false; reason: RejectionReason; status: number; error: string }

export type GuardInput = {
  name: unknown
  email: unknown
  body: unknown
  honeypot: unknown
  elapsedMs: unknown
  ip: string
}

function logRejection(reason: RejectionReason, ip: string) {
  console.warn(
    JSON.stringify({
      evt: "comment_rejected",
      reason,
      ip: ip.slice(0, 20),
      ts: new Date().toISOString(),
    }),
  )
}

/**
 * Run every check cheapest-first, same order as the subscribe guard. A bot
 * rejection gets a generic message so an author cannot tell which rule
 * caught them; a rate-limited human gets copy that tells them to wait.
 */
export function guardComment(input: GuardInput): GuardResult {
  const { honeypot, elapsedMs, ip } = input

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    logRejection("honeypot", ip)
    return { ok: false, reason: "honeypot", status: 400, error: "Something went wrong. Try again?" }
  }

  if (typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs < MIN_SUBMIT_MS) {
    logRejection("too_fast", ip)
    return { ok: false, reason: "too_fast", status: 400, error: "Something went wrong. Try again?" }
  }

  if (!rateLimiter.check(ip)) {
    logRejection("rate_limited", ip)
    return {
      ok: false,
      reason: "rate_limited",
      status: 429,
      error: "Too many comments. Try again in a few minutes.",
    }
  }

  const validated = validateComment(input)
  if (!validated.ok) {
    return { ok: false, reason: "invalid", status: 400, error: validated.error }
  }

  return { ok: true, value: validated.value }
}

/** Test seam: the rate-limit map is module state and outlives a single request. */
export function resetCommentRateLimit() {
  rateLimiter.reset()
}
