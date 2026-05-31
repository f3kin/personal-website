export const LINKS = {
  site: {
    base: "https://finlayekins.com",
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
    writing: "https://medium.com/@finlayekins",
  },
  company: {
    hourglassAI: "https://www.thehourglass.ai",
  },
} as const

export type LinkGroups = typeof LINKS
export type SocialKey = keyof LinkGroups["social"]

