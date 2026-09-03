import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { checkLikeRateLimit } from "@/lib/like-guard"
import { clientIp } from "@/lib/subscribe-guard"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

const SLUG = /^[a-z0-9-]+$/i
/** A client-generated id kept in localStorage, not a real identity. */
const VISITOR_ID = /^[a-z0-9-]{8,64}$/i

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32)
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim()
  if (!slug || !SLUG.test(slug)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid slug." }, { status: 400 })
  }

  const { count, error } = await supabaseAdmin()
    .from("site_likes")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug)

  if (error) {
    console.error("[/api/likes] count failed", error)
    return NextResponse.json({ ok: false, error: "Could not load likes." }, { status: 502 })
  }

  return NextResponse.json({ ok: true, count: count ?? 0 })
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const slug = typeof b.slug === "string" ? b.slug.trim() : ""
  const visitorId = typeof b.visitor_id === "string" ? b.visitor_id.trim() : ""
  if (!slug || !SLUG.test(slug)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid slug." }, { status: 400 })
  }
  if (!visitorId || !VISITOR_ID.test(visitorId)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid visitor id." }, { status: 400 })
  }

  const ip = clientIp(req)
  if (!checkLikeRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "Too many likes. Try again in a few minutes." }, { status: 429 })
  }

  // One like per (slug, visitor_id): a repeat like from the same browser is
  // silently a no-op rather than an error, since the client may retry after
  // losing the response.
  const { error } = await supabaseAdmin()
    .from("site_likes")
    .upsert(
      { slug, visitor_id: visitorId, ip_hash: hashIp(ip) },
      { onConflict: "slug,visitor_id", ignoreDuplicates: true },
    )

  if (error) {
    console.error("[/api/likes] insert failed", error)
    return NextResponse.json({ ok: false, error: "Could not record like." }, { status: 502 })
  }

  const { count, error: countError } = await supabaseAdmin()
    .from("site_likes")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug)

  if (countError) {
    console.error("[/api/likes] recount failed", countError)
    return NextResponse.json({ ok: true, count: null })
  }

  return NextResponse.json({ ok: true, count: count ?? 0 })
}
