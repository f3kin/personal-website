import { NextResponse } from "next/server"
import { createSubscription } from "@/lib/beehiiv"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const email = typeof (body as { email?: unknown })?.email === "string"
    ? ((body as { email: string }).email).trim().toLowerCase()
    : ""

  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    )
  }

  try {
    const result = await createSubscription(email)
    if (!result.ok) {
      const status = result.kind === "validation" ? 400 : 502
      return NextResponse.json(result, { status })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error("[/api/subscribe] unexpected error", err)
    return NextResponse.json(
      {
        ok: false,
        kind: "upstream" as const,
        error: "Subscribe is temporarily unavailable. Try again in a moment?",
      },
      { status: 502 },
    )
  }
}
