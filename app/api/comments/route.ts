import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { guardComment } from "@/lib/comment-guard"
import { ELAPSED_FIELD, HONEYPOT_FIELD } from "@/lib/subscribe-fields"
import { clientIp } from "@/lib/subscribe-guard"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

const SLUG = /^[a-z0-9-]+$/i

/**
 * Never store the raw IP: a hash is enough to group repeat submissions for
 * abuse review. Unsalted, so it is a lookup key, not real anonymisation - an
 * IPv4 is small enough to brute-force back from the hash.
 */
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32)
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim()
  if (!slug || !SLUG.test(slug)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid slug." }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin()
    .from("site_comments")
    .select("id, author_name, body, created_at")
    .eq("slug", slug)
    .eq("hidden", false)
    .order("created_at", { ascending: true })
    .limit(500)

  if (error) {
    console.error("[/api/comments] list failed", error)
    return NextResponse.json({ ok: false, error: "Could not load comments." }, { status: 502 })
  }

  return NextResponse.json({ ok: true, comments: data })
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
  if (!slug || !SLUG.test(slug)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid slug." }, { status: 400 })
  }

  const ip = clientIp(req)
  const guard = guardComment({
    name: b.name,
    email: b.email,
    body: b.body,
    honeypot: b[HONEYPOT_FIELD],
    elapsedMs: b[ELAPSED_FIELD],
    ip,
  })
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status })
  }

  const { data, error } = await supabaseAdmin()
    .from("site_comments")
    .insert({
      slug,
      author_name: guard.value.name,
      author_email: guard.value.email ?? null,
      body: guard.value.body,
      ip_hash: hashIp(ip),
    })
    .select("id, author_name, body, created_at")
    .single()

  if (error) {
    console.error("[/api/comments] insert failed", error)
    return NextResponse.json(
      { ok: false, error: "Comments are temporarily unavailable. Try again in a moment?" },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, comment: data })
}
