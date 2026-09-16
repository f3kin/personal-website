import ExploreSection from "@/components/home/explore-section"
import PageContent from "@/components/layout/page-content"
import { listPublishedPosts } from "@/lib/beehiiv"

export default async function Home() {
  const posts = await listPublishedPosts({ limit: 6 })
  const newsletterCovers = posts
    .filter((post) => post.thumbnail_url)
    .slice(0, 3)
    .map((post) => ({
      src: post.thumbnail_url as string,
      title: post.title,
    }))

  return (
    <PageContent className="min-h-[100svh]">
      <ExploreSection newsletterCovers={newsletterCovers} />
    </PageContent>
  )
}
