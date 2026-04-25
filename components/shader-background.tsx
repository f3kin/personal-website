"use client"

import { useEffect, useRef } from "react"

export default function ShaderBackground() {
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const el = preRef.current
    if (!el) return

    let animationId: number
    let time = 0

    const render = () => {
      const charW = 8.4
      const charH = 14 // matches font-size: 14px with leading-none (line-height: 1)
      const cols = Math.floor(window.innerWidth / charW)
      // overshoot by a few rows so text always reaches past the bottom edge
      const rows = Math.ceil(window.innerHeight / charH) + 2

      const grid: string[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(" ")
      )

      // deterministic noise so spray doesn't flicker
      const n = (x: number, y: number, seed: number) =>
        Math.sin(x * 12.989 + y * 78.23 + seed) * 0.5 +
        Math.sin(x * 4.31 - y * 19.71 + seed * 1.7) * 0.3

      const waveLength = 90
      const troughH = rows * 0.25
      const crestH = rows * 0.75

      for (let x = 0; x < cols; x++) {
        // scrolling phase (right to left)
        const scrolled = x + time * 40
        const phase =
          (((scrolled % waveLength) + waveLength) % waveLength) / waveLength

        // --- wave body height ---
        let bodyH: number
        if (phase < 0.2) {
          bodyH = troughH
        } else if (phase < 0.6) {
          const t = (phase - 0.2) / 0.4
          bodyH = troughH + (crestH - troughH) * t * t * (3 - 2 * t)
        } else if (phase < 0.72) {
          bodyH = crestH
        } else if (phase < 0.88) {
          const t = (phase - 0.72) / 0.16
          bodyH = crestH - (crestH - troughH) * t * t
        } else {
          const t = (phase - 0.88) / 0.12
          bodyH = troughH + (crestH - troughH) * (1 - t) * 0.05
        }

        const surfaceRow = Math.floor(rows - bodyH)

        // --- curling lip at the crest ---
        if (phase > 0.66 && phase < 0.93) {
          const ct = (phase - 0.66) / 0.27
          const lipArc = Math.sin(ct * Math.PI) * 7
          const lipRow = surfaceRow - Math.floor(lipArc) - 2

          for (let ly = Math.max(0, lipRow); ly < Math.min(surfaceRow, rows); ly++) {
            const v = n(x, ly, time * 0.6 + 5)
            if (v > 0.1) grid[ly][x] = "≈"
            else if (v > -0.1) grid[ly][x] = "~"
            else if (v > -0.3) grid[ly][x] = "∼"
          }
        }

        // --- fill wave body (consistent style throughout) ---
        for (let y = Math.max(0, surfaceRow); y < rows; y++) {
          const v = n(x, y, time * 0.8)

          if (y <= surfaceRow + 1) {
            grid[y][x] = v > 0 ? "~" : "≈"
          } else {
            if (v > 0.1) grid[y][x] = "≈"
            else if (v > -0.1) grid[y][x] = "~"
            else if (v > -0.3) grid[y][x] = "∼"
            else grid[y][x] = " "
          }
        }
      }

      // --- secondary smaller wave layer (background depth) ---
      const smallWaveLen = 50
      const smallTrough = rows * 0.1
      const smallCrest = rows * 0.4
      for (let x = 0; x < cols; x++) {
        const scrolled = x + time * 25
        const phase =
          (((scrolled % smallWaveLen) + smallWaveLen) % smallWaveLen) /
          smallWaveLen

        let h: number
        if (phase < 0.2) {
          h = smallTrough
        } else if (phase < 0.6) {
          const t = (phase - 0.2) / 0.4
          h = smallTrough + (smallCrest - smallTrough) * t * t * (3 - 2 * t)
        } else if (phase < 0.75) {
          h = smallCrest
        } else {
          const t = (phase - 0.75) / 0.25
          h = smallCrest - (smallCrest - smallTrough) * t * t
        }

        const sr = Math.floor(rows - h)
        for (let y = Math.max(0, sr); y < rows; y++) {
          if (grid[y][x] === " ") {
            const v = n(x, y, time * 0.5 + 50)
            if (v > 0.1) grid[y][x] = "≈"
            else if (v > -0.1) grid[y][x] = "~"
            else if (v > -0.25) grid[y][x] = "∼"
          }
        }
      }

      el.textContent = grid.map((row) => row.join("")).join("\n")
      time += 0.002
      animationId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <pre
      ref={preRef}
      className="fixed -z-10 overflow-hidden leading-none select-none"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: "calc(-1 * env(safe-area-inset-bottom, 0px) - 50px)",
        fontSize: "14px",
        fontFamily: "monospace",
        color: "hsl(var(--primary) / 0.25)",
        letterSpacing: "0.05em",
      }}
      aria-hidden="true"
    />
  )
}
