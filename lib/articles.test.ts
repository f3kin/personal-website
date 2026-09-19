import { describe, expect, it } from "bun:test"
import { normaliseTitle, withoutHostedDuplicates } from "./articles"

describe("withoutHostedDuplicates", () => {
  const hosted = [{ title: "Finding the Right Game" }]

  it("drops an external post whose title matches a hosted article", () => {
    const posts = [
      { title: "Finding the Right Game" },
      { title: "Some Other Essay" },
    ]
    expect(withoutHostedDuplicates(posts, hosted)).toEqual([{ title: "Some Other Essay" }])
  })

  it("matches despite punctuation and case differences", () => {
    const posts = [{ title: "finding the right game!" }]
    expect(withoutHostedDuplicates(posts, hosted)).toEqual([])
  })

  it("keeps everything when no articles are hosted", () => {
    const posts = [{ title: "Finding the Right Game" }]
    expect(withoutHostedDuplicates(posts, [])).toEqual(posts)
  })
})

describe("normaliseTitle", () => {
  it("strips apostrophes rather than splitting on them", () => {
    expect(normaliseTitle("Everything I Learnt in Reverse’s Sequel")).toBe(
      "everything i learnt in reverses sequel",
    )
  })
})
