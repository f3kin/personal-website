import { beforeEach, describe, expect, it } from "bun:test"
import { BODY_MAX, MIN_SUBMIT_MS, NAME_MAX, guardComment, resetCommentRateLimit, validateComment } from "./comment-guard"

const base = {
  name: "Ada",
  email: "",
  body: "Great read.",
  honeypot: "",
  elapsedMs: MIN_SUBMIT_MS + 1000,
  ip: "1.2.3.4",
}

describe("validateComment", () => {
  it("accepts a name and body with no email", () => {
    const result = validateComment({ name: " Ada ", email: "", body: " Great read. " })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ name: "Ada", body: "Great read.", email: undefined })
    }
  })

  it("rejects a missing name", () => {
    const result = validateComment({ name: "  ", email: "", body: "Great read." })
    expect(result.ok).toBe(false)
  })

  it("rejects a missing body", () => {
    const result = validateComment({ name: "Ada", email: "", body: "  " })
    expect(result.ok).toBe(false)
  })

  it("rejects a name over the length cap", () => {
    const result = validateComment({ name: "a".repeat(NAME_MAX + 1), email: "", body: "hi" })
    expect(result.ok).toBe(false)
  })

  it("rejects a body over the length cap", () => {
    const result = validateComment({ name: "Ada", email: "", body: "a".repeat(BODY_MAX + 1) })
    expect(result.ok).toBe(false)
  })

  it("rejects a malformed email", () => {
    const result = validateComment({ name: "Ada", email: "not-an-email", body: "hi" })
    expect(result.ok).toBe(false)
  })

  it("accepts a well-formed optional email", () => {
    const result = validateComment({ name: "Ada", email: "ada@example.com", body: "hi" })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.email).toBe("ada@example.com")
  })
})

describe("guardComment", () => {
  beforeEach(() => resetCommentRateLimit())

  it("passes a well-formed, well-timed, non-bot submission", () => {
    const result = guardComment(base)
    expect(result.ok).toBe(true)
  })

  it("rejects a filled-in honeypot", () => {
    const result = guardComment({ ...base, honeypot: "im-a-bot" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("honeypot")
  })

  it("rejects a submission faster than the minimum time", () => {
    const result = guardComment({ ...base, elapsedMs: MIN_SUBMIT_MS - 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("too_fast")
  })

  it("lets a submission through when no timing value was sent", () => {
    const result = guardComment({ ...base, elapsedMs: undefined })
    expect(result.ok).toBe(true)
  })

  it("rate-limits an IP after the allowance is used up", () => {
    const results = Array.from({ length: 6 }, () => guardComment({ ...base, ip: "9.9.9.9" }))
    expect(results.filter((r) => r.ok)).toHaveLength(5)
    const last = results[5]
    expect(last.ok).toBe(false)
    if (!last.ok) expect(last.reason).toBe("rate_limited")
  })

  it("keeps a separate rate-limit bucket per IP", () => {
    for (let i = 0; i < 5; i++) guardComment({ ...base, ip: "1.1.1.1" })
    const result = guardComment({ ...base, ip: "2.2.2.2" })
    expect(result.ok).toBe(true)
  })

  it("still validates content after passing the bot checks", () => {
    const result = guardComment({ ...base, name: "" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("invalid")
  })
})
