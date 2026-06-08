import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PageContent from "@/components/layout/page-content"
import SubscribeForm from "@/components/writing/subscribe-form"
import AuthorCard from "@/components/writing/author-card"
import {
  extractHeroFromHtml,
  formatPostDate,
  getPostBySlug,
  sanitizeBeehiivHtml,
} from "@/lib/beehiiv"

export const dynamic = "force-dynamic"
export const revalidate = 300

type Params = { slug: string }

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Writing  -  Finlay Ekins" }
  return {
    title: `${post.title}  -  Finlay Ekins`,
    description: post.subtitle || post.preview_text || undefined,
    openGraph: {
      title: post.title,
      description: post.subtitle || post.preview_text || undefined,
      images: post.thumbnail_url ? [{ url: post.thumbnail_url }] : undefined,
      type: "article",
    },
  }
}

export default async function WritingPost({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const sanitised = sanitizeBeehiivHtml(post.content?.free?.web ?? "")
  const { heroUrl, html } = extractHeroFromHtml(sanitised)

  return (
    <PageContent className="pt-16 sm:pt-24 pb-20">
      <article className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <nav className="mb-8">
            <Link
              href="/writing"
              className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← All issues
            </Link>
          </nav>

          <header className="mb-8">
            <time className="block text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-4">
              {formatPostDate(post)}
            </time>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-foreground mb-3">
              {post.title}
            </h1>
            {(() => {
              const sub =
                post.subject_line ||
                post.email_settings?.email_subject_line ||
                post.subtitle ||
                null
              return sub ? (
                <p className="text-lg text-muted-foreground leading-relaxed">{sub}</p>
              ) : null
            })()}
          </header>

          <div className="mb-8">
            <AuthorCard />
          </div>

          {heroUrl ? (
            <div className="relative aspect-square mb-8 overflow-hidden rounded-lg bg-muted">
              <Image
                src={heroUrl}
                alt={post.title}
                fill
                sizes="(min-width: 768px) 672px, 100vw"
                priority
                fetchPriority="high"
                className="object-cover"
              />
            </div>
          ) : null}

          {html ? (
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : post.web_url ? (
            <p className="text-muted-foreground">
              This post is available on the{" "}
              <a
                href={post.web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                newsletter site
              </a>
              .
            </p>
          ) : (
            <p className="text-muted-foreground">This issue isn&apos;t available right now.</p>
          )}

          <div className="mt-16">
            <SubscribeForm />
          </div>
        </div>
      </article>
    </PageContent>
  )
}
