"use client"

import { useEffect, useState } from "react"

const NAME = "Finlay Ekins"
const LETTER_DELAY = 0.05
const ANIM_DURATION = 0.4
const VISIBLE_DURATION = 3000
const HIDDEN_DURATION = 1500

export default function Hero() {
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
    <section className="relative pb-2 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-3 sm:mb-4 h-[1.5em]">
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
        </div>
      </div>
    </section>
  )
}
