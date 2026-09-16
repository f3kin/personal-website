"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LINKS } from "@/lib/links"

// Inline link style for this page: a soft rounded chip with a blue underline,
// so links read as tappable objects rather than as coloured words.
const LINK_STYLE =
  "rounded-md bg-primary/[0.07] px-1.5 py-0.5 text-foreground/90 no-underline " +
  "transition-colors hover:bg-primary/[0.14] hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"

const NEWSLETTER_SUBSCRIBE_URL =
  "/newsletter?utm_source=website&utm_medium=homepage&utm_campaign=homepage_newsletter"

const NAME = "Finlay Ekins"
const LETTER_DELAY = 0.05
const ANIM_DURATION = 0.4
const VISIBLE_DURATION = 3000
const HIDDEN_DURATION = 1500

function AnimatedName() {
  const [visible, setVisible] = useState(true)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const totalAnimTime = NAME.length * LETTER_DELAY * 1000 + ANIM_DURATION * 1000

    if (visible) {
      const timer = setTimeout(() => setVisible(false), totalAnimTime + VISIBLE_DURATION)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setCycle((c) => c + 1)
        setVisible(true)
      }, totalAnimTime + HIDDEN_DURATION)
      return () => clearTimeout(timer)
    }
  }, [visible])

  return (
    <p className="mb-5 h-[1.5em] text-[10px] uppercase tracking-[0.3em] text-primary sm:text-xs">
      {NAME.split("").map((char, i) => (
        <span
          key={`${cycle}-${i}`}
          className={`inline-block motion-reduce:animate-none motion-reduce:opacity-100 ${visible ? "opacity-0 animate-[fadeUp_0.4s_ease_forwards]" : "animate-[fadeDown_0.4s_ease_forwards]"}`}
          style={{ animationDelay: `${i * LETTER_DELAY}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </p>
  )
}

export default function ExploreSection() {
  return (
    <section className="container mx-auto flex min-h-[100svh] items-center px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-2xl text-center">
        <AnimatedName />

        <div className="rounded-2xl border border-primary/20 bg-background/95 px-6 py-7 text-left shadow-sm sm:px-9 sm:py-9">
          <p className="mb-3 text-sm font-medium text-primary">
            My Friday newsletter
          </p>
          <h1 className="max-w-xl text-balance text-2xl font-medium leading-tight tracking-[-0.025em] sm:text-3xl">
            What I&apos;m seeing in AI, and what we&apos;re actually building.
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            A useful five-minute note, every Friday.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href={NEWSLETTER_SUBSCRIBE_URL}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Subscribe
            </Link>
            <Link
              href="/writing"
              className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
            >
              Read my newsletter <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-7 space-y-3 sm:mt-8">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            I love{" "}
            <Link
              href={LINKS.content.books}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_STYLE}
            >
              reading
            </Link>
            , and{" "}
            <Link href="/writing" className={LINK_STYLE}>
              writing
            </Link>
            .
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            I spend my time running{" "}
            <Link
              href={LINKS.company.hourglassAI}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_STYLE}
            >
              Hourglass AI
            </Link>
            .
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Talk to me about surfing, basketball, or philosophy.
          </p>
        </div>
      </div>
    </section>
  )
}
