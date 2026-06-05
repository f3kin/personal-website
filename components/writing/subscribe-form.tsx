"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Status = "idle" | "loading" | "success" | "error"

export default function SubscribeForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)

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
        body: JSON.stringify({ email: trimmed }),
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
