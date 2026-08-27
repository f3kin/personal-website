import { ImageResponse } from "next/og"

export const alt = "Finlay's Newsletter. Every Friday: what I'm seeing in AI, and what we're actually building."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Social card for the newsletter page, and the thumbnail LinkedIn pulls for a
 * Featured link. Typographic rather than photographic, to match the site: the
 * promise is the only thing on it, because at Featured-card size a photo would
 * be unreadable and the promise is what earns the click.
 *
 * 1200x630 is the standard 1.91:1 ratio LinkedIn, X and Slack all crop to.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0f16",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#5b8def",
              marginBottom: 40,
            }}
          >
            Finlay&apos;s Newsletter
          </div>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.15,
              color: "#f2f5fa",
              letterSpacing: -1.5,
              maxWidth: 940,
            }}
          >
            Every Friday: what I&apos;m seeing in AI, and what we&apos;re
            actually building.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #232a36",
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 26, color: "#8b95a4" }}>
            Notes from running an AI company in Melbourne
          </div>
          <div style={{ fontSize: 26, color: "#5b8def" }}>
            finlayekins.com
          </div>
        </div>
      </div>
    ),
    size,
  )
}
