import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lost  -  Finlay Ekins",
  description: "You look lost.",
}

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="pointer-events-auto text-center">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          you look lost :(
        </p>
        <Link
          href="/"
          className="mt-3 inline-block text-xs text-muted-foreground/70 underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          back
        </Link>
      </div>
    </div>
  )
}
