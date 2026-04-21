"use client"

import { useState } from "react"

interface ActivityHeatmapProps {
  songDates: string[]
  weeks?: number
}

function buildHeatmapData(songDates: string[], weeks: number) {
  // Build a map of date -> count from real data
  const dayMap = new Map<string, number>()
  for (const d of songDates) {
    const key = new Date(d).toISOString().slice(0, 10)
    dayMap.set(key, (dayMap.get(key) || 0) + 1)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from Monday of the week `weeks-1` weeks ago
  const startDay = new Date(today)
  startDay.setDate(today.getDate() - ((today.getDay() || 7) - 1) - (weeks - 1) * 7)

  const cells: { key: string; count: number; level: number; isFuture: boolean; isToday: boolean }[] = []

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(startDay)
      day.setDate(startDay.getDate() + w * 7 + d)
      const key = day.toISOString().slice(0, 10)
      const count = dayMap.get(key) || 0
      const isFuture = day > today
      const isToday = key === today.toISOString().slice(0, 10)
      const level = isFuture ? 0 : count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
      cells.push({ key, count, level, isFuture, isToday })
    }
  }

  return cells
}

const LEVEL_CLASSES = [
  "bg-[oklch(0.94_0_0)]",
  "bg-[oklch(0.78_0_0)]",
  "bg-[oklch(0.62_0_0)]",
  "bg-[oklch(0.46_0_0)]",
  "bg-[oklch(0.28_0_0)]",
]

const LEGEND_LEVELS = [0, 1, 2, 3, 4]

export function ActivityHeatmap({ songDates, weeks = 26 }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const cells = buildHeatmapData(songDates, weeks)

  return (
    <section className="mt-10 pt-8 border-t border-[oklch(0.93_0_0)]">
      <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[oklch(0.62_0_0)] mb-5 text-center">
        Actividad
      </p>

      <div
        className="grid gap-[3px] mb-2"
        style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
      >
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`aspect-square rounded-[1px] cursor-default transition-opacity hover:opacity-70 ${LEVEL_CLASSES[cell.level]} ${cell.isFuture ? "opacity-30" : ""}`}
            style={cell.isToday ? { outline: "2px solid #4a90d9", outlineOffset: "-1px" } : undefined}
            onMouseMove={(e) => {
              const songs = cell.isFuture ? 0 : cell.count
              const label = cell.isFuture
                ? cell.key
                : songs === 0
                ? `${cell.key} — sin canciones`
                : `${cell.key} — ${songs} canción${songs > 1 ? "es" : ""}`
              setTooltip({ text: label, x: e.clientX + 12, y: e.clientY - 28 })
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-[3px] justify-end">
        <span className="font-mono text-[0.55rem] text-[oklch(0.72_0_0)] mx-[3px]">menos</span>
        {LEGEND_LEVELS.map((l) => (
          <div key={l} className={`w-[10px] h-[10px] rounded-[1px] ${LEVEL_CLASSES[l]}`} />
        ))}
        <span className="font-mono text-[0.55rem] text-[oklch(0.72_0_0)] mx-[3px]">más</span>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed bg-foreground text-background font-mono text-[0.6rem] px-2 py-1 pointer-events-none z-50 whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </section>
  )
}
