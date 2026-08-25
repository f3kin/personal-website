export const LINKS = {
  site: {
    // The apex 307s to www, so www is the canonical origin. Used for
    // metadataBase, og:url, the sitemap and robots, which should all agree
    // with the domain that actually serves the page.
    base: "https://www.finlayekins.com",
  },
  social: {
    linkedin: "https://www.linkedin.com/in/finlayekins",
    instagram: "https://www.instagram.com/finlayekins/",
    x: "https://x.com/finlayekins",
    spotify: "https://open.spotify.com/user/finlaydekins?si=mr0Vwy4tSdqL4lbt_yQ0fA",
    email: "mailto:finlay@thehourglass.ai",
  },
  content: {
    books: "https://finlay-ekins.notion.site/books",
  },
  newsletter: {
    site: "/writing",
    subscribe: "/newsletter",
  },
  company: {
    hourglassAI: "https://www.thehourglass.ai",
  },
} as const

export type LinkGroups = typeof LINKS
export type SocialKey = keyof LinkGroups["social"]

