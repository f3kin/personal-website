"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ELAPSED_FIELD, HONEYPOT_FIELD } from "@/lib/subscribe-fields"

type Status = "idle" | "loading" | "success" | "error"

/**
 * Read the UTM tags off the current URL so Beehiiv can attribute the signup to
 * the channel that sent it. Without this every signup lands in one bucket and
 * the acquisition report cannot tell X from LinkedIn from direct.
 */
function readUtms() {
  if (typeof window === "undefined") return {}
  const q = new URLSearchParams(window.location.search)
  return {
    utm_source: q.get("utm_source") ?? undefined,
    utm_medium: q.get("utm_medium") ?? undefined,
    utm_campaign: q.get("utm_campaign") ?? undefined,
    referring_site: document.referrer || undefined,
  }
}

export default function SubscribeForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)
  // When this component first rendered, so the server can reject submissions
  // that arrive faster than a person could plausibly type an address.
  const mountedAt = useRef(Date.now())
  // Honeypot: hidden from people, filled in by bots that populate every input.
  const [honeypot, setHoneypot] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setStatus("error")
      setMessage("Enter an email address.")
      return
    }
    setStatus("loading")
    setMessage(null)
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          [HONEYPOT_FIELD]: honeypot,
          [ELAPSED_FIELD]: Date.now() - mountedAt.current,
          ...readUtms(),
        }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string; status?: string }
      if (!res.ok || !json.ok) {
        setStatus("error")
        setMessage(json.error || "Something went wrong. Try again?")
        return
      }
      setStatus("success")
      setMessage(
        json.status === "active"
          ? "You're in. The next issue lands in your inbox."
          : "Check your inbox to confirm your subscription.",
      )
      setEmail("")
    } catch {
      setStatus("error")
      setMessage("Network error. Try again?")
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        {/*
          Honeypot. Kept out of the layout and out of the accessibility tree, and
          off the tab order, so no real user (screen reader included) can reach it.
          `hidden` alone is skipped by some bots, so pair it with aria-hidden.
        */}
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
        <Input
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none"
        />
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {status === "loading" ? "Subscribing…" : status === "success" ? "Subscribed" : "Subscribe"}
        </Button>
      </form>
      {message ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`mt-3 text-sm ${
            status === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
