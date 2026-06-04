import Link from "next/link"
import type { Metadata } from "next"
import { LINKS } from "@/lib/links"
import PageContent from "@/components/layout/page-content"
import IssueList from "@/components/writing/issue-list"
import { listPublishedPosts } from "@/lib/beehiiv"

export const metadata: Metadata = {
  title: "Writing  -  Finlay Ekins",
  description: "My weekly notes on AI and where the world's going.",
}

export const revalidate = 3600

export default async function WritingPage() {
  const posts = await listPublishedPosts({ limit: 50 })

  return (
    <PageContent className="pt-16 sm:pt-24 pb-20">
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <header className="mb-10 text-center">
            <h1 className="font-sans font-normal text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-3 h-[1.5em]">
              Newsletter
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              My weekly notes on AI and where the world&apos;s going.
            </p>
          </header>

          {posts.length === 0 ? <EmptyState /> : <IssueList posts={posts} />}
        </div>
      </section>
    </PageContent>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The first issue lands this Friday.
        <br />
        <Link
          href={LINKS.newsletter.subscribe}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Subscribe to be the first to read it
        </Link>
      </p>
    </div>
  )
}
