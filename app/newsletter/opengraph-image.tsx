import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { listPublishedPosts } from "@/lib/beehiiv"

export const alt = "Finlay's Newsletter. Every Friday: what I'm seeing in AI, and what we're actually building."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 3600

/**
 * Social card for /newsletter, and for every short link that rewrites to it
 * (/x, /li/...). X and LinkedIn show it at roughly 500px wide, so nothing
 * here is smaller than 30px at full size (about 12px on screen).
 *
 * Light on purpose: most of the feed it lands in is X dark mode, where a dark
 * card disappears. The latest issue's cover and title make it change every
 * Friday, so the same "I write about this" reply never shows a stale card.
 * X overlays its own title chip bottom-left, so that corner stays image-only.
 */

const INK = "#0b1220"
const MUTED = "#4a5568"
const BLUE = "#2563d8"
const BG = "#f7f8fa"
const SERIES: string | null = null

const fontDir = join(process.cwd(), "app/newsletter/og-fonts")

async function latestIssue(): Promise<{ title: string; cover: string; number: number } | null> {
  // The archive filter already drops pre-relaunch issues, so the count of
  // live posts is the issue number (the June 2026 relaunch is issue 1).
  const posts = await listPublishedPosts({ limit: 100 })
  const post = posts[0]
  if (!post?.thumbnail_url) return null
  const res = await fetch(post.thumbnail_url).catch(() => null)
  if (!res?.ok) return null
  const bytes = Buffer.from(await res.arrayBuffer())
  // Sniff the bytes: Beehiiv serves JPEG uploads as image/png, and Satori
  // renders a blank box when the data URL's type is wrong. It only decodes
  // PNG and JPEG, so anything else falls back.
  const type = bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" : null
  if (!type) return null
  return { title: post.title, number: posts.length, cover: `data:${type};base64,${bytes.toString("base64")}` }
}

async function fallbackCover(): Promise<string> {
  const bytes = await readFile(join(process.cwd(), "public/newsletter/og-fallback.png"))
  return `data:image/png;base64,${bytes.toString("base64")}`
}

function clampTitle(title: string, max = 64): string {
  if (title.length <= max) return title
  return title.slice(0, title.lastIndexOf(" ", max)) + "…"
}

export default async function Image() {
  const [issue, poppinsSemi, poppinsMedium, interRegular, interMedium] = await Promise.all([
    latestIssue(),
    readFile(join(fontDir, "Poppins-SemiBold.ttf")),
    readFile(join(fontDir, "Poppins-Medium.ttf")),
    readFile(join(fontDir, "Inter-Regular.ttf")),
    readFile(join(fontDir, "Inter-Medium.ttf")),
  ])
  const cover = issue?.cover ?? (await fallbackCover())

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: BG,
          padding: "0 64px",
          fontFamily: "Inter",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          width={470}
          height={470}
          style={{ borderRadius: 28, objectFit: "cover", border: "1px solid #e3e7ee" }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: 470,
            marginLeft: 56,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: 60,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                color: INK,
              }}
            >
              Finlay&apos;s Newsletter
            </div>
            {SERIES ? (
              <div style={{ fontSize: 32, color: MUTED, marginTop: 12 }}>{SERIES}</div>
            ) : null}

            {issue ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: SERIES ? 36 : 40 }}>
                <div style={{ fontSize: 30, fontWeight: 500, color: BLUE }}>{`Issue ${issue.number}`}</div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 500,
                    fontSize: 42,
                    lineHeight: 1.2,
                    color: INK,
                    marginTop: 8,
                  }}
                >
                  {clampTitle(issue.title)}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 36, lineHeight: 1.35, color: MUTED, marginTop: 32 }}>
                Notes from running an AI company at 23.
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: BLUE,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 500,
                padding: "16px 34px",
                borderRadius: 999,
              }}
            >
              Subscribe free
            </div>
            <div style={{ fontSize: 30, color: MUTED, marginLeft: 24 }}>Every Friday</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: poppinsSemi, weight: 600, style: "normal" },
        { name: "Poppins", data: poppinsMedium, weight: 500, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
      ],
    },
  )
}
