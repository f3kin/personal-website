import { afterEach, describe, expect, it, mock } from "bun:test"

const insertedComment = {
  id: "11111111-1111-1111-1111-111111111111",
  author_name: "Ada",
  body: "Nice one",
  created_at: new Date().toISOString(),
}

function mockSupabaseInsert() {
  mock.module("@/lib/supabase", () => ({
    supabaseAdmin: () => ({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: insertedComment, error: null }),
          }),
        }),
      }),
    }),
  }))
}

describe("POST /api/comments", () => {
  afterEach(() => {
    mock.restore()
  })

  it("notifies on a successful comment", async () => {
    mockSupabaseInsert()
    const notifyNewComment = mock(() => Promise.resolve())
    mock.module("@/lib/notify", () => ({ notifyNewComment }))

    const { POST } = await import("./route")
    const req = new Request("http://localhost/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.5" },
      body: JSON.stringify({ slug: "issue-1", name: "Ada", body: "Nice one", elapsed_ms: 5000 }),
    })

    const res = await POST(req)
    const json = (await res.json()) as { ok: boolean }

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(notifyNewComment).toHaveBeenCalledTimes(1)
    expect(notifyNewComment.mock.calls[0][0]).toEqual({
      id: insertedComment.id,
      slug: "issue-1",
      name: "Ada",
      body: "Nice one",
    })
  })

  it("does not notify when the guard rejects the submission", async () => {
    mockSupabaseInsert()
    const notifyNewComment = mock(() => Promise.resolve())
    mock.module("@/lib/notify", () => ({ notifyNewComment }))

    const { POST } = await import("./route")
    const req = new Request("http://localhost/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.6" },
      // No name: fails validation inside the guard.
      body: JSON.stringify({ slug: "issue-1", name: "", body: "Nice one", elapsed_ms: 5000 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(notifyNewComment).not.toHaveBeenCalled()
  })
})
