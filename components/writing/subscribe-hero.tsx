import Image from "next/image"
import Link from "next/link"
import SubscribeForm from "./subscribe-form"
import { formatPostDate, slugFromWebUrl, type BeehiivPost } from "@/lib/beehiiv"

/**
 * The subscribe pitch, paired with the most recent issue's artwork. The hero
 * images are the most distinctive thing about the newsletter, so the page leads
 * with one rather than with a wall of type.
 */
export default function SubscribeHero({ latest }: { latest?: BeehiivPost }) {
  const slug = latest ? slugFromWebUrl(latest.web_url) : null

  return (
    <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:items-center">
      <div>
        <p className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-6">
          Finlay&apos;s Newsletter
        </p>

        <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-normal leading-[1.15] tracking-tight text-balance">
          Every Friday: what I&apos;m seeing in AI, and what we&apos;re actually
          building.
        </h1>

        <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
          I&apos;m 23, running an AI company out of Melbourne, and writing down
          what I learn. About five minutes.
        </p>

        <div className="mt-8">
          <SubscribeForm />
        </div>
      </div>

      {latest ? (
        <Link
          href={slug ? `/writing/${slug}` : "/writing"}
          className="group relative block aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted"
        >
          {latest.thumbnail_url ? (
            <Image
              src={latest.thumbnail_url}
              alt={latest.title}
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              quality={90}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <time className="block text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1.5">
              Latest issue &middot; {formatPostDate(latest)}
            </time>
            <h2 className="text-lg sm:text-xl font-medium leading-snug text-white line-clamp-2">
              {latest.title}
            </h2>
          </div>
        </Link>
      ) : null}
    </div>
  )
}
