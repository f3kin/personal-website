import Image from "next/image"
import { formatExternalDate, type ExternalPost } from "@/lib/external-posts"

export default function ExternalCard({ post }: { post: ExternalPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted"
    >
      {post.image ? (
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(min-width: 768px) 560px, (min-width: 640px) 100vw, 100vw"
          quality={90}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <time className="block text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1.5">
          {formatExternalDate(post.date)}
        </time>
        <h2 className="text-sm sm:text-base font-medium leading-snug text-white line-clamp-3">
          {post.title}
        </h2>
      </div>
    </a>
  )
}
