import type { ExternalPost } from "@/lib/external-posts"
import ExternalCard from "./external-card"

type Props = {
  title: string
  description?: string
  posts: ExternalPost[]
  homeUrl?: string
  homeLabel?: string
  emptyText?: string
}

export default function ExternalSection({
  title,
  description,
  posts,
  homeUrl,
  homeLabel,
  emptyText,
}: Props) {
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-sans font-normal text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-2">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          ) : null}
        </div>
        {homeUrl && homeLabel ? (
          <a
            href={homeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            {homeLabel} →
          </a>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {emptyText ?? "Nothing here yet."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <ExternalCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
