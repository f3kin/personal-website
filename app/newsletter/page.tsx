import Link from "next/link"
import type { Metadata } from "next"
import PageContent from "@/components/layout/page-content"
import SubscribeHero from "@/components/writing/subscribe-hero"
import WhatYouGet from "@/components/writing/what-you-get"
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

// One job: convert. The only navigation is back home and through to the archive.
export default async function NewsletterPage() {
  const posts = await listPublishedPosts({ limit: 4 })
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

          <SubscribeHero latest={latest} />

          <div className="mt-20 sm:mt-24">
            <WhatYouGet />
          </div>

          {recent.length > 0 ? (
            <div className="mt-20 sm:mt-24">
              <h2 className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                Recent issues
              </h2>
              <IssueList posts={recent} />
              <p className="mt-8">
                <Link
                  href="/writing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border"
                >
                  Read the full archive →
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </PageContent>
  )
}
