import Image from "next/image"
import Link from "next/link"
import { LINKS } from "@/lib/links"
import { formatPostDate, slugFromWebUrl, type BeehiivPost } from "@/lib/beehiiv"

export default function IssueCard({ post }: { post: BeehiivPost }) {
  const slug = slugFromWebUrl(post.web_url)
  const href = slug ? `/writing/${slug}` : (post.web_url ?? LINKS.newsletter.site)
  const isExternal = href.startsWith("http")

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group relative block aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted"
    >
      {post.thumbnail_url ? (
        <Image
          src={post.thumbnail_url}
          alt={post.title}
          fill
          sizes="(min-width: 768px) 280px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={post.thumbnail_url.startsWith("http")}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <time className="block text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1.5">
          {formatPostDate(post)}
        </time>
        <h2 className="text-sm sm:text-base font-medium leading-snug text-white line-clamp-3">
          {post.title}
        </h2>
      </div>
    </Link>
  )
}
