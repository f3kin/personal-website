import { afterEach, describe, expect, it, mock } from "bun:test"

describe("notifyNewComment", () => {
  const originalKey = process.env.RESEND_API_KEY

  afterEach(() => {
    mock.restore()
    if (originalKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalKey
  })

  it("does nothing when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY
    const send = mock(() => Promise.resolve({ data: null, error: null }))
    mock.module("resend", () => ({ Resend: mock(() => ({ emails: { send } })) }))

    const { notifyNewComment } = await import("./notify")
    await notifyNewComment({ id: "c1", slug: "issue-1", name: "Ada", body: "Nice one" })

    expect(send).not.toHaveBeenCalled()
  })

  it("sends an email with the comment details when configured", async () => {
    process.env.RESEND_API_KEY = "test-key"
    const send = mock(() => Promise.resolve({ data: { id: "abc" }, error: null }))
    mock.module("resend", () => ({ Resend: mock(() => ({ emails: { send } })) }))

    const { notifyNewComment } = await import("./notify")
    await notifyNewComment({ id: "c1", slug: "issue-1", name: "Ada", body: "Nice one" })

    expect(send).toHaveBeenCalledTimes(1)
    const payload = send.mock.calls[0][0] as { to: string; subject: string; text: string }
    expect(payload.to).toBe("finlay@hourglassdigital.com.au")
    expect(payload.subject).toContain("issue-1")
    expect(payload.subject).toContain("Ada")
    expect(payload.text).toContain("Nice one")
    expect(payload.text).toContain("/api/comments/c1")
  })

  it("swallows a send failure without throwing", async () => {
    process.env.RESEND_API_KEY = "test-key"
    const send = mock(() => Promise.reject(new Error("network down")))
    mock.module("resend", () => ({ Resend: mock(() => ({ emails: { send } })) }))

    const { notifyNewComment } = await import("./notify")
    await expect(
      notifyNewComment({ slug: "issue-1", name: "Ada", body: "Nice one" }),
    ).resolves.toBeUndefined()
  })
})
