import { beforeEach, describe, expect, it } from "bun:test"
import { checkLikeRateLimit, resetLikeRateLimit } from "./like-guard"

describe("checkLikeRateLimit", () => {
  beforeEach(() => resetLikeRateLimit())

  it("allows likes under the per-IP allowance", () => {
    expect(checkLikeRateLimit("1.2.3.4")).toBe(true)
  })

  it("rejects once an IP exceeds its allowance", () => {
    const results = Array.from({ length: 31 }, () => checkLikeRateLimit("5.5.5.5"))
    expect(results.filter(Boolean)).toHaveLength(30)
    expect(results[30]).toBe(false)
  })
})
