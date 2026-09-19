import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

export interface HostedArticle {
  slug: string
  title: string
  previewText: string
  date: string
  xUrl: string
  xArticleUrl: string
  cover: string | null
  html: string
}

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles")

export async function getArticles(): Promise<HostedArticle[]> {
  let files: string[]
  try {
    files = await readdir(ARTICLES_DIR)
  } catch {
    return []
  }
  const articles = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) =>
        JSON.parse(await readFile(path.join(ARTICLES_DIR, f), "utf8")) as HostedArticle,
      ),
  )
  return articles.sort((a, b) => b.date.localeCompare(a.date))
}

export async function getArticleBySlug(slug: string): Promise<HostedArticle | null> {
  const articles = await getArticles()
  return articles.find((a) => a.slug === slug) ?? null
}

export function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/**
 * Drop external posts (e.g. Substack cross-posts of a hosted article) whose
 * title matches a hosted article, so /writing doesn't list the same piece
 * twice. The hosted copy is canonical.
 */
export function withoutHostedDuplicates<T extends { title: string }>(
  posts: T[],
  articles: Pick<HostedArticle, "title">[],
): T[] {
  const hosted = new Set(articles.map((a) => normaliseTitle(a.title)))
  return posts.filter((p) => !hosted.has(normaliseTitle(p.title)))
}

export function formatArticleDate(date: string): string {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Melbourne",
  })
}
