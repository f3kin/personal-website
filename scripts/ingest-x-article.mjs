#!/usr/bin/env node
// Ingest a published X (Twitter) article as hosted site content.
//
// Usage: node scripts/ingest-x-article.mjs <status-url-or-id>
//
// Fetches the share post via FxTwitter, converts the article's Draft.js
// blocks to HTML, downloads the cover and inline images to
// public/articles/<slug>/, and writes content/articles/<slug>.json.
// The published X text is the source of truth, never a local draft.

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { makeSubstackCover } from "./substack-cover.mjs"

const input = process.argv[2]
if (!input) {
  console.error("usage: node scripts/ingest-x-article.mjs <status-url-or-id>")
  process.exit(1)
}
const statusId = (input.match(/(\d{15,25})/) || [])[1]
if (!statusId) {
  console.error(`no status id found in: ${input}`)
  process.exit(1)
}

const res = await fetch(`https://api.fxtwitter.com/i/status/${statusId}`)
if (!res.ok) {
  console.error(`fxtwitter ${res.status} for status ${statusId}`)
  process.exit(1)
}
const tweet = (await res.json()).tweet
const article = tweet?.article
if (!article) {
  console.error("status has no attached article")
  process.exit(1)
}

const slug = article.title
  .toLowerCase()
  .replace(/['’]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")

const assetDir = path.join("public", "articles", slug)
const assetUrl = (name) => `/articles/${slug}/${name}`
await mkdir(assetDir, { recursive: true })
await mkdir(path.join("content", "articles"), { recursive: true })

const mediaUrlById = new Map(
  (article.media_entities ?? []).map((m) => [
    String(m.media_id),
    m.media_info?.original_img_url ?? null,
  ]),
)

async function download(url, name) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download failed ${r.status}: ${url}`)
  await writeFile(path.join(assetDir, name), Buffer.from(await r.arrayBuffer()))
  return assetUrl(name)
}

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const STYLE_TAGS = { BOLD: "strong", ITALIC: "em", CODE: "code" }

// Render one block's text with inline styles + link entities applied.
function renderInline(block, entityMap) {
  const text = block.text ?? ""
  const spans = []
  for (const r of block.inlineStyleRanges ?? []) {
    const tag = STYLE_TAGS[r.style]
    if (tag) spans.push({ start: r.offset, end: r.offset + r.length, open: `<${tag}>`, close: `</${tag}>` })
  }
  for (const r of block.entityRanges ?? []) {
    const entity = entityMap.get(String(r.key))
    const url = entity?.type === "LINK" ? entity?.data?.url : null
    if (url && /^https?:\/\//i.test(url))
      spans.push({
        start: r.offset,
        end: r.offset + r.length,
        open: `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">`,
        close: "</a>",
      })
  }
  const bounds = [...new Set([0, text.length, ...spans.flatMap((s) => [s.start, s.end])])].sort(
    (a, b) => a - b,
  )
  let html = ""
  for (let i = 0; i < bounds.length - 1; i++) {
    const [from, to] = [bounds[i], bounds[i + 1]]
    const active = spans.filter((s) => s.start <= from && s.end >= to)
    html +=
      active.map((s) => s.open).join("") +
      escapeHtml(text.slice(from, to)) +
      active
        .map((s) => s.close)
        .reverse()
        .join("")
  }
  return html
}

async function renderAtomic(block, entityMap) {
  const parts = []
  for (const r of block.entityRanges ?? []) {
    const entity = entityMap.get(String(r.key))
    for (const item of entity?.data?.mediaItems ?? []) {
      const src = mediaUrlById.get(String(item.mediaId))
      if (!src) continue
      const ext = path.extname(new URL(src).pathname) || ".jpg"
      const local = await download(src, `${item.mediaId}${ext}`)
      parts.push(`<figure><img src="${local}" alt="" loading="lazy" /></figure>`)
    }
  }
  return parts.join("\n")
}

const LIST_TAGS = { "ordered-list-item": "ol", "unordered-list-item": "ul" }

async function blocksToHtml(content) {
  const entityMap = new Map(
    Array.isArray(content.entityMap)
      ? content.entityMap.map((e) => [String(e.key), e.value])
      : Object.entries(content.entityMap ?? {}).map(([k, v]) => [String(k), v]),
  )
  const out = []
  let openList = null
  const closeList = () => {
    if (openList) out.push(`</${openList}>`)
    openList = null
  }
  for (const block of content.blocks ?? []) {
    const type = block.type ?? "unstyled"
    const listTag = LIST_TAGS[type]
    if (listTag) {
      if (openList !== listTag) {
        closeList()
        out.push(`<${listTag}>`)
        openList = listTag
      }
      out.push(`<li>${renderInline(block, entityMap)}</li>`)
      continue
    }
    closeList()
    if (type === "atomic") {
      const html = await renderAtomic(block, entityMap)
      if (html) out.push(html)
    } else if (type.startsWith("header-")) {
      const level = { one: 1, two: 2, three: 3, four: 4 }[type.split("-")[1]] ?? 2
      out.push(`<h${level}>${renderInline(block, entityMap)}</h${level}>`)
    } else if (type === "blockquote") {
      out.push(`<blockquote><p>${renderInline(block, entityMap)}</p></blockquote>`)
    } else {
      const html = renderInline(block, entityMap)
      if (html.trim()) out.push(`<p>${html}</p>`)
    }
  }
  closeList()
  return out.join("\n")
}

const coverSrc = article.cover_media?.media_info?.original_img_url ?? null
let cover = null
if (coverSrc) {
  const ext = path.extname(new URL(coverSrc).pathname) || ".jpg"
  cover = await download(coverSrc, `cover${ext}`)
  // Substack crops headers to 1.91:1; give it a reframed copy to paste in.
  await makeSubstackCover(path.join(assetDir, `cover${ext}`))
}

const record = {
  slug,
  title: article.title,
  previewText: article.preview_text ?? "",
  date: article.created_at,
  xUrl: tweet.url,
  xArticleUrl: `https://x.com/i/article/${article.id}`,
  cover,
  html: await blocksToHtml(article.content),
}

const outPath = path.join("content", "articles", `${slug}.json`)
await writeFile(outPath, `${JSON.stringify(record, null, 2)}\n`)
console.log(`wrote ${outPath} (${record.html.length} chars of html, cover: ${cover ?? "none"})`)
