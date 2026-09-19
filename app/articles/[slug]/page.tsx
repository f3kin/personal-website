import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PageContent from "@/components/layout/page-content"
import SubscribeForm from "@/components/writing/subscribe-form"
import AuthorCard from "@/components/writing/author-card"
import LikeButton from "@/components/writing/like-button"
import CommentsSection from "@/components/writing/comments-section"
import { formatArticleDate, getArticleBySlug, getArticles } from "@/lib/articles"
import { LINKS } from "@/lib/links"

export const revalidate = 3600

type Params = { slug: string }

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map(({ slug }) => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: "Articles  -  Finlay Ekins" }
  return {
    title: `${article.title}  -  Finlay Ekins`,
    description: article.previewText || undefined,
    alternates: { canonical: `${LINKS.site.base}/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.previewText || undefined,
      images: article.cover ? [{ url: article.cover }] : undefined,
      type: "article",
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  return (
    <PageContent className="pt-16 sm:pt-24 pb-20">
      <article className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <nav className="mb-8">
            <Link
              href="/writing"
              className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← All writing
            </Link>
          </nav>

          <header className="mb-8">
            <time className="block text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-4">
              {formatArticleDate(article.date)}
            </time>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-foreground mb-3">
              {article.title}
            </h1>
          </header>

          <div className="mb-8">
            <AuthorCard />
          </div>

          {article.cover ? (
            <div className="relative aspect-video mb-8 overflow-hidden rounded-lg bg-muted">
              <Image
                src={article.cover}
                alt={article.title}
                fill
                sizes="(min-width: 768px) 672px, 100vw"
                priority
                fetchPriority="high"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="post-content" dangerouslySetInnerHTML={{ __html: article.html }} />

          <p className="mt-10 text-sm text-muted-foreground">
            Originally published as an{" "}
            <a
              href={article.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              article on X
            </a>
            .
          </p>

          <div className="mt-10 flex items-center gap-4">
            <LikeButton slug={slug} />
            <span className="text-sm text-muted-foreground">
              Enjoyed this one? Say so, or leave a comment below.
            </span>
          </div>

          <CommentsSection slug={slug} />

          <div className="mt-16">
            <SubscribeForm />
          </div>
        </div>
      </article>
    </PageContent>
  )
}
