import Link from "next/link"
import type { Metadata } from "next"
import PageContent from "@/components/layout/page-content"
import IssueList from "@/components/writing/issue-list"
import SubscribeForm from "@/components/writing/subscribe-form"
import ExternalSection from "@/components/writing/external-section"
import { listPublishedPosts } from "@/lib/beehiiv"
import { getExternalPosts } from "@/lib/external-posts"

export const metadata: Metadata = {
  title: "Writing  -  Finlay Ekins",
  description: "My weekly notes on AI and where the world's going.",
}

export const dynamic = "force-dynamic"
export const revalidate = 300

export default async function WritingPage() {
  const [posts, mediumPosts, substackPosts] = await Promise.all([
    listPublishedPosts({ limit: 50 }),
    getExternalPosts("medium", "finlayekins"),
    getExternalPosts("substack", "finlayekins"),
  ])

  const otherPosts = [...mediumPosts, ...substackPosts].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  return (
    <PageContent className="pt-16 sm:pt-24 pb-20">
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-8">
            <Link
              href="/"
              className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Home
            </Link>
          </nav>

          <div className="mb-12">
            <SubscribeForm />
          </div>

          <h1 className="font-sans font-normal text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-6">
            Newsletter
          </h1>

          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The first issue lands this Friday.
              </p>
            </div>
          ) : (
            <IssueList posts={posts} />
          )}

          <ExternalSection
            title="Other writing"
            posts={otherPosts}
            emptyText="Nothing to show here yet."
          />
        </div>
      </section>
    </PageContent>
  )
}
