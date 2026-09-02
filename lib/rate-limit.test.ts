import { describe, expect, it } from "bun:test"
import { createRateLimiter } from "./rate-limit"

describe("createRateLimiter", () => {
  it("allows up to the max, then rejects", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000 })
    const results = Array.from({ length: 4 }, () => limiter.check("k"))
    expect(results).toEqual([true, true, true, false])
  })

  it("tracks separate keys independently", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
    expect(limiter.check("a")).toBe(true)
    expect(limiter.check("b")).toBe(true)
    expect(limiter.check("a")).toBe(false)
  })

  it("resets a key's count once its window has passed", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
    const now = Date.now()
    expect(limiter.check("k", now)).toBe(true)
    expect(limiter.check("k", now + 500)).toBe(false)
    expect(limiter.check("k", now + 1001)).toBe(true)
  })

  it("reset() clears every bucket", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
    limiter.check("k")
    limiter.reset()
    expect(limiter.check("k")).toBe(true)
  })

  it("evicts the oldest keys once maxKeys is exceeded", () => {
    const limiter = createRateLimiter({ max: 100, windowMs: 60_000, maxKeys: 2 })
    limiter.check("a")
    limiter.check("b")
    limiter.check("c")
    // "a" should have been evicted, so it gets a fresh bucket, not a 4th hit
    // against a bucket that would otherwise have persisted.
    expect(limiter.check("a")).toBe(true)
  })
})
