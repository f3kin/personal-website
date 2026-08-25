/**
 * The two standing sections of every issue, stated plainly. This is the
 * "countable promise" half of the pitch: the reader should know exactly what
 * lands, and the page should never promise more than the newsletter delivers.
 */
const SECTIONS = [
  {
    title: "What I'm Seeing in AI",
    body: "The things that actually moved this week, and why they matter, rather than a link roundup. Opinionated, and wrong sometimes.",
  },
  {
    title: "What I'm Building",
    body: "The inside of an AI-native company: what we shipped, what it replaced, what it cost, and what broke on the way.",
  },
]

export default function WhatYouGet() {
  return (
    <div>
      <h2 className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
        Every issue
      </h2>
      <dl className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-background p-6">
            <dt className="text-base font-medium tracking-tight">{section.title}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
