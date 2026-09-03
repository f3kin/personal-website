import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Constant-time compare so a mistimed response can't leak the token byte by byte. */
function matchesToken(auth: string | null, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`)
  const actual = Buffer.from(auth ?? "")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/**
 * Minimal moderation path: hide a comment. No admin UI; call this with
 * curl/fetch and the admin token. See supabase/migrations for the SQL
 * one-liner alternative (hide or hard-delete directly).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) {
    return NextResponse.json({ ok: false, error: "Moderation is not configured." }, { status: 503 })
  }

  if (!matchesToken(req.headers.get("authorization"), adminToken)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  if (!UUID.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid comment id." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }
  const hidden = (body as { hidden?: unknown })?.hidden
  if (typeof hidden !== "boolean") {
    return NextResponse.json({ ok: false, error: "Body must include a boolean 'hidden'." }, { status: 400 })
  }

  const { error } = await supabaseAdmin().from("site_comments").update({ hidden }).eq("id", id)
  if (error) {
    console.error("[/api/comments/[id]] update failed", error)
    return NextResponse.json({ ok: false, error: "Could not update comment." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
