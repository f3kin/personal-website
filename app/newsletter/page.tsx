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

// Deliberately no nav beyond a single way back: this page has one job.
export default async function NewsletterPage() {
  const posts = await listPublishedPosts({ limit: 3 })

  return (
    <PageContent className="pt-16 sm:pt-24 pb-20">
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-12">
            <Link
              href="/"
              className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Home
            </Link>
          </nav>

          <SubscribeHero />

          {posts.length > 0 ? (
            <div className="mt-20">
              <h2 className="font-sans font-normal text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                Recent issues
              </h2>
              <IssueList posts={posts} />
              <p className="mt-8">
                <Link
                  href="/writing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Read the full archive
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </PageContent>
  )
}
