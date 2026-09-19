import Link from "next/link"
import type { Metadata } from "next"
import PageContent from "@/components/layout/page-content"
import IssueList from "@/components/writing/issue-list"
import SubscribeForm from "@/components/writing/subscribe-form"
import ExternalCard from "@/components/writing/external-card"
import ArticleCard from "@/components/writing/article-card"
import { listPublishedPosts } from "@/lib/beehiiv"
import { getExternalPosts } from "@/lib/external-posts"
import { getArticles, withoutHostedDuplicates } from "@/lib/articles"

export const metadata: Metadata = {
  title: "Writing  -  Finlay Ekins",
  description: "My weekly notes on AI and where the world's going.",
}

export const dynamic = "force-dynamic"
export const revalidate = 300

export default async function WritingPage() {
  const [posts, articles, mediumPosts, substackPosts] = await Promise.all([
    listPublishedPosts({ limit: 50 }),
    getArticles(),
    getExternalPosts("medium", "finlayekins"),
    getExternalPosts("substack", "finlayekins"),
  ])

  // Substack cross-posts of hosted articles are the same piece; the hosted
  // copy is canonical, so it alone appears here. Hosted and external pieces
  // share one date-sorted Articles grid.
  const externalPosts = withoutHostedDuplicates(
    [...mediumPosts, ...substackPosts],
    articles,
  )
  const allArticles = [
    ...articles.map((article) => ({ kind: "hosted" as const, date: article.date, article })),
    ...externalPosts.map((post) => ({ kind: "external" as const, date: post.date, post })),
  ].sort((a, b) => b.date.localeCompare(a.date))

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

          {allArticles.length > 0 ? (
            <section className="mt-16">
              <h2 className="font-sans font-normal text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-6">
                Articles
              </h2>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {allArticles.map((item) => (
                  <li key={item.kind === "hosted" ? item.article.slug : item.post.id}>
                    {item.kind === "hosted" ? (
                      <ArticleCard article={item.article} />
                    ) : (
                      <ExternalCard post={item.post} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </PageContent>
  )
}
