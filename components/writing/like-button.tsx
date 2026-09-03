"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "fe_visitor_id"

function readVisitorId(): string {
  if (typeof window === "undefined") return ""
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    // Private browsing or storage disabled: fall back to a per-load id, which
    // just means this visit won't remember it already liked the article.
    return crypto.randomUUID()
  }
}

function likedKey(slug: string) {
  return `fe_liked_${slug}`
}

export default function LikeButton({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    try {
      setLiked(window.localStorage.getItem(likedKey(slug)) === "1")
    } catch {
      // Ignore: without storage the button just always looks un-liked.
    }
    fetch(`/api/likes?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((json: { ok: boolean; count?: number }) => {
        if (json.ok && typeof json.count === "number") setCount(json.count)
      })
      .catch(() => {})
  }, [slug])

  async function onClick() {
    if (liked || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, visitor_id: readVisitorId() }),
      })
      const json = (await res.json()) as { ok: boolean; count?: number | null }
      if (json.ok) {
        setLiked(true)
        if (typeof json.count === "number") setCount(json.count)
        try {
          window.localStorage.setItem(likedKey(slug), "1")
        } catch {
          // Ignore: the like still landed server-side.
        }
      }
    } catch {
      // Silent failure: liking is a nicety, not worth surfacing an error for.
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
        liked
          ? "bg-primary/20 text-primary"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      <span>{liked ? "Liked" : "Like"}</span>
      <span className="text-muted-foreground">{count ?? " - "}</span>
    </button>
  )
}
