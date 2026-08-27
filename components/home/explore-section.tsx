"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LINKS } from "@/lib/links"

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

            {/* The page's only call to action, sitting directly under the name.
                Styled as a quiet outline rather than a filled button: it should
                read as an option, not as the point of the page. */}
            <Link
              href={LINKS.newsletter.subscribe}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-4 py-1.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              Read my newsletter
              <span aria-hidden="true">→</span>
            </Link>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              I love{" "}
              <Link
                href={LINKS.content.books}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                reading
              </Link>
              , and{" "}
              <Link href="/writing" className="underline underline-offset-4">
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
                className="underline underline-offset-4"
              >
                Hourglass AI
              </Link>
              .
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Talk to me about surfing, basketball, or philosophy.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
