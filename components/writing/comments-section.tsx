"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ELAPSED_FIELD, HONEYPOT_FIELD } from "@/lib/subscribe-fields"

type Comment = { id: string; author_name: string; body: string; created_at: string }
type Status = "idle" | "loading" | "success" | "error"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

export default function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const mountedAt = useRef(Date.now())
  const [honeypot, setHoneypot] = useState("")

  useEffect(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((json: { ok: boolean; comments?: Comment[] }) => {
        setComments(json.ok && json.comments ? json.comments : [])
      })
      .catch(() => setComments([]))
  }, [slug])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !body.trim()) {
      setStatus("error")
      setMessage("Enter your name and a comment.")
      return
    }
    setStatus("loading")
    setMessage(null)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          email: email.trim() || undefined,
          body: body.trim(),
          [HONEYPOT_FIELD]: honeypot,
          [ELAPSED_FIELD]: Date.now() - mountedAt.current,
        }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string; comment?: Comment }
      if (!res.ok || !json.ok) {
        setStatus("error")
        setMessage(json.error || "Something went wrong. Try again?")
        return
      }
      setStatus("success")
      setMessage("Comment posted.")
      setComments((prev) => [...(prev ?? []), json.comment!])
      setName("")
      setEmail("")
      setBody("")
    } catch {
      setStatus("error")
      setMessage("Network error. Try again?")
    }
  }

  return (
    <section className="mt-16">
      <h2 className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
        Comments{comments && comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {comments === null ? null : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-8">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-6 mb-10">
          {comments.map((c) => (
            <li key={c.id} className="border-t border-border/60 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-foreground">{c.author_name}</p>
                <time className="text-xs text-muted-foreground shrink-0">{formatDate(c.created_at)}</time>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div hidden aria-hidden="true">
          <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "loading"}
            className="sm:flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none"
          />
          <Input
            type="email"
            placeholder="Email (optional, never shown)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="sm:flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none"
          />
        </div>
        <Textarea
          placeholder="Write a comment…"
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={status === "loading"}
          className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none"
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className="bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {status === "loading" ? "Posting…" : "Post comment"}
        </Button>
        {message ? (
          <p
            role={status === "error" ? "alert" : "status"}
            className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  )
}
