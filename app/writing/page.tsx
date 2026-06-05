import type { Metadata } from "next"
import PageContent from "@/components/layout/page-content"
import IssueList from "@/components/writing/issue-list"
import SubscribeForm from "@/components/writing/subscribe-form"
import { listPublishedPosts } from "@/lib/beehiiv"

export const metadata: Metadata = {
  title: "Writing  -  Finlay Ekins",
  description: "My weekly notes on AI and where the world's going.",
}

export const dynamic = "force-dynamic"
export const revalidate = 300

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

          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center mb-12">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The first issue lands this Friday.
              </p>
            </div>
          ) : (
            <div className="mb-16">
              <IssueList posts={posts} />
            </div>
          )}

          <SubscribeForm />
        </div>
      </section>
    </PageContent>
  )
}
