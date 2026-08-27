import Link from "next/link"
import type { Metadata } from "next"
import PageContent from "@/components/layout/page-content"
import SubscribeHero from "@/components/writing/subscribe-hero"
import IssueList from "@/components/writing/issue-list"
import { listPublishedPosts } from "@/lib/beehiiv"

export const metadata: Metadata = {
  title: "Newsletter  -  Finlay Ekins",
  description:
    "Every Friday: what I'm seeing in AI, and what we're actually building. Notes from running an AI company in Melbourne.",
  openGraph: {
    title: "Finlay's Newsletter",
    description:
      "Every Friday: what I'm seeing in AI, and what we're actually building.",
    type: "website",
  },
}

export const dynamic = "force-dynamic"
export const revalidate = 300

// One job: convert. Two blocks only, the pitch and proof it is real and regular.
export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // A rewrite keeps the short URL in the address bar, which means the client
  // cannot read the UTMs off window.location any more. They arrive here
  // instead, so the attribution is passed down explicitly.
  const [posts, params] = await Promise.all([
    listPublishedPosts({ limit: 4 }),
    searchParams,
  ])
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const attribution = {
    utm_source: one(params.utm_source),
    utm_medium: one(params.utm_medium),
    utm_campaign: one(params.utm_campaign),
  }
  const [latest, ...recent] = posts

  return (
    <PageContent className="pt-16 sm:pt-24 pb-24">
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <nav className="mb-12">
            <Link
              href="/"
              className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Home
            </Link>
          </nav>

          <SubscribeHero latest={latest} attribution={attribution} />

          {recent.length > 0 ? (
            <div className="mt-20 sm:mt-28">
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h2 className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Recent issues
                </h2>
                <Link
                  href="/writing"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Archive →
                </Link>
              </div>
              <IssueList posts={recent} />
            </div>
          ) : null}
        </div>
      </section>
    </PageContent>
  )
}
