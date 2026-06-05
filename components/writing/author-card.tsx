import Image from "next/image"
import { SOCIALS } from "@/lib/socials"

const SOCIAL_ICONS = {
  linkedin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  ),
  x: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.5 2h4.2l4.5 6 5.3-6H22l-7.1 8.1L22 22h-4.3l-5-6.6L7 22H2.5l7.6-8.6L3.5 2z" />
    </svg>
  ),
  email: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
}

const SOCIAL_LINKS: Array<{ key: keyof typeof SOCIAL_ICONS; href: string; label: string }> = [
  { key: "x", href: SOCIALS.x, label: "X" },
  { key: "linkedin", href: SOCIALS.linkedin, label: "LinkedIn" },
  { key: "instagram", href: SOCIALS.instagram, label: "Instagram" },
  { key: "email", href: SOCIALS.email, label: "Email" },
]

export default function AuthorCard() {
  return (
    <section className="flex items-center gap-4 sm:gap-5 py-6 border-y border-border/60">
      <Image
        src="/images/me.png"
        alt="Finlay Ekins"
        width={56}
        height={56}
        className="h-14 w-14 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Finlay Ekins</p>
        <p className="text-xs text-muted-foreground">Founder, Hourglass AI. Writing about AI from Australia.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {SOCIAL_LINKS.map(({ key, href, label }) => (
          <a
            key={key}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            aria-label={label}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {SOCIAL_ICONS[key]}
          </a>
        ))}
      </div>
    </section>
  )
}
