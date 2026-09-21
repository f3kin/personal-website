#!/usr/bin/env node
// Reframe an article cover for Substack's 1.91:1 header and link previews.
//
// Usage: node scripts/substack-cover.mjs <slug> [<slug> ...]
//
// X article covers are 5:2 and often a small graphic on a plain background,
// which Substack's crop turns into a tiny chart floating in empty space.
// This finds the graphic against the corner colour, frames it at 1.91:1 with
// a margin, and writes public/articles/<slug>/cover-substack.png (1200x628).
// Full-bleed covers just get a centred 1.91:1 crop.

import { readdir } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import sharp from "sharp"

const RATIO = 1200 / 628
const OUT_W = 1200
const OUT_H = 628
// Graphic height as a share of the frame; the rest is breathing room.
const FILL = 0.7

async function contentBox(file) {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const bg = [data[0], data[1], data[2]]
  let [left, top, right, bottom] = [width, height, -1, -1]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const diff =
        Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2])
      if (diff > 60) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  return { width, height, box: right < 0 ? null : { left, top, right, bottom } }
}

export async function makeSubstackCover(coverFile) {
  const { width, height, box } = await contentBox(coverFile)
  const fullBleed =
    !box || (box.right - box.left) / width > 0.8 || (box.bottom - box.top) / height > 0.8

  let cropW
  let cropH
  let cx = width / 2
  let cy = height / 2
  if (fullBleed) {
    cropH = Math.min(height, width / RATIO)
    cropW = cropH * RATIO
  } else {
    const boxW = box.right - box.left + 1
    const boxH = box.bottom - box.top + 1
    cropH = Math.max(boxH / FILL, boxW / FILL / RATIO)
    cropW = cropH * RATIO
    if (cropW > width) [cropW, cropH] = [width, width / RATIO]
    if (cropH > height) [cropW, cropH] = [height * RATIO, height]
    cx = (box.left + box.right) / 2
    cy = (box.top + box.bottom) / 2
  }
  const left = Math.round(Math.min(Math.max(cx - cropW / 2, 0), width - cropW))
  const top = Math.round(Math.min(Math.max(cy - cropH / 2, 0), height - cropH))

  const outFile = path.join(path.dirname(coverFile), "cover-substack.png")
  await sharp(coverFile)
    .extract({ left, top, width: Math.round(cropW), height: Math.round(cropH) })
    .resize(OUT_W, OUT_H, { kernel: "lanczos3" })
    .png()
    .toFile(outFile)
  return outFile
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slugs = process.argv.slice(2)
  if (slugs.length === 0) {
    console.error("usage: node scripts/substack-cover.mjs <slug> [<slug> ...]")
    process.exit(1)
  }
  for (const slug of slugs) {
    const dir = path.join("public", "articles", slug)
    const cover = (await readdir(dir)).find((f) => /^cover\.(png|jpe?g|webp)$/i.test(f))
    if (!cover) {
      console.error(`${slug}: no cover found in ${dir}`)
      process.exitCode = 1
      continue
    }
    console.log(`${slug}: wrote ${await makeSubstackCover(path.join(dir, cover))}`)
  }
}
