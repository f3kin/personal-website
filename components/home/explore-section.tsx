"use client"

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

function AnimatedName() {
  return (
    <p className="mb-7 h-[1.5em] text-[10px] uppercase tracking-[0.34em] text-primary sm:mb-9 sm:text-xs">
      {NAME.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block opacity-0 animate-[fadeUp_0.4s_ease_forwards] motion-reduce:animate-none motion-reduce:opacity-100"
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
    <section className="container mx-auto flex min-h-[100svh] items-center px-5 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-3xl text-center">
        <AnimatedName />

        <div className="mx-auto max-w-2xl">
          <h1 className="text-balance text-[2rem] font-medium leading-[1.12] tracking-[-0.03em] sm:text-5xl">
            What I&apos;m seeing in AI, and what we&apos;re actually building.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            A useful five-minute note, every Friday.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:mt-8">
            <Link
              href={NEWSLETTER_SUBSCRIBE_URL}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Get Friday&apos;s issue
            </Link>
            <Link
              href="/writing"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors duration-200 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
            >
              Read past issues <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="mx-auto mt-9 h-px w-12 bg-primary/30 sm:mt-11" />

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
