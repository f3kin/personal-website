"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LINKS } from "@/lib/links"

// Inline link style for this page: a soft rounded chip with a blue underline,
// so links read as tappable objects rather than as coloured words.
const LINK_STYLE =
  "rounded-md bg-primary/[0.07] px-1.5 py-0.5 text-foreground/90 " +
  "underline decoration-primary/50 underline-offset-4 decoration-2 " +
  "transition-colors hover:bg-primary/[0.14] hover:text-foreground hover:decoration-primary"

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
    <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-3 h-[1.5em]">
      {NAME.split("").map((char, i) => (
        <span
          key={`${cycle}-${i}`}
          className={`inline-block ${visible ? "opacity-0 animate-[fadeUp_0.4s_ease_forwards]" : "animate-[fadeDown_0.4s_ease_forwards]"}`}
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
    <section className="container mx-auto px-4 pt-4 pb-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="space-y-3">
            <AnimatedName />

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Talk to me about surfing, basketball, or philosophy.
            </p>

            {/* The page's only call to action. Plain text in the same style as
                the links above it, so it sits with the sentences rather than
                sitting on top of them. */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <Link
                href={LINKS.newsletter.subscribe}
                className={LINK_STYLE}
              >
                Read my newsletter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
