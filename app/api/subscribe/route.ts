import { NextResponse } from "next/server"
import { createSubscription, type SubscriptionAttribution } from "@/lib/beehiiv"
import { ELAPSED_FIELD, HONEYPOT_FIELD } from "@/lib/subscribe-fields"
import { clientIp, guardSubscription } from "@/lib/subscribe-guard"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined)

function readAttribution(body: unknown, req: Request): SubscriptionAttribution {
  const b = (body ?? {}) as Record<string, unknown>
  return {
    utm_source: str(b.utm_source),
    utm_medium: str(b.utm_medium),
    utm_campaign: str(b.utm_campaign),
    // Falls back to the browser referrer when the link carried no UTMs, which
    // is the only signal available for untagged inbound traffic.
    referring_site: str(b.referring_site) ?? str(req.headers.get("referer") ?? undefined),
  }
}

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

  // Bot filters run after the address is known to be well-formed, so a
  // rejection can be logged against its domain, and before Beehiiv is called,
  // so junk never reaches the list.
  const b = (body ?? {}) as Record<string, unknown>
  const guard = guardSubscription({
    email,
    honeypot: b[HONEYPOT_FIELD],
    elapsedMs: b[ELAPSED_FIELD],
    ip: clientIp(req),
  })
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status })
  }

  try {
    const result = await createSubscription(email, readAttribution(body, req))
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
