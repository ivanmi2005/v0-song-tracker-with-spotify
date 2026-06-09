"use client"

import { useEffect, useRef, useState } from "react"

const TRIGGERS = ["marco", "marko", "barrios", "atleticostats", "beeeeee"]
const MAX_TRIGGER_LEN = Math.max(...TRIGGERS.map((t) => t.length))
const AUDIO_URL = "https://files.catbox.moe/1cqwhe.mp3"
const SHEEP_URL = "https://em-content.zobj.net/source/google/439/ewe_1f411.png"
const CYCLE_MS = 30_000
const SPAWN_MIN_MS = 250
const SPAWN_MAX_MS = 800
const SIDE_BAND_VW = 18 // ancho de cada banda lateral; centro libre = 100 - 2*18 = 64vw

interface Sheep {
  id: number
  side: "left" | "right"
  offset: number // 0..100 (% dentro de la banda lateral)
  size: number
  fallDur: number
  spinDur: number
  spinReverse: boolean
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

// No disparar triggers mientras se escribe en un campo (buscador, login…).
function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
}

interface MrMarkoProps {
  active: boolean
  onToggle: () => void
}

export function MrMarko({ active, onToggle }: MrMarkoProps) {
  const [sheep, setSheep] = useState<Sheep[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sheepIdRef = useRef(0)
  const activeRef = useRef(false)
  const onToggleRef = useRef(onToggle)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    onToggleRef.current = onToggle
  }, [onToggle])

  // Triggers de teclado: cualquiera de las palabras activa/desactiva el modo.
  useEffect(() => {
    let buf = ""
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || isTypingTarget(e)) return
      buf = (buf + e.key.toLowerCase()).slice(-MAX_TRIGGER_LEN)
      if (TRIGGERS.some((t) => buf.endsWith(t))) {
        buf = ""
        onToggleRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Audio: 1 reproducción cada 30s. La primera suena al activar.
  useEffect(() => {
    if (!active) return
    if (!audioRef.current) {
      audioRef.current = new Audio(AUDIO_URL)
      audioRef.current.preload = "auto"
      audioRef.current.volume = 0.85
    }
    const audio = audioRef.current
    const play = () => {
      if (!activeRef.current) return
      try {
        audio.currentTime = 0
        void audio.play()
      } catch {
        /* noop */
      }
    }
    play() // primer beeeeee al activar
    const interval = window.setInterval(play, CYCLE_MS)
    return () => {
      window.clearInterval(interval)
      try {
        audio.pause()
      } catch {
        /* noop */
      }
    }
  }, [active])

  // Spawner de ovejas por los bordes; centro intacto.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let spawnTimer = 0
    const removeTimers: number[] = []

    const spawn = () => {
      if (cancelled) return
      const id = ++sheepIdRef.current
      const s: Sheep = {
        id,
        side: Math.random() < 0.5 ? "left" : "right",
        offset: Math.random() * 100,
        size: rand(32, 60),
        fallDur: rand(5, 10),
        spinDur: rand(3, 7),
        spinReverse: Math.random() < 0.5,
      }
      setSheep((prev) => [...prev, s])
      removeTimers.push(
        window.setTimeout(() => {
          setSheep((prev) => prev.filter((p) => p.id !== id))
        }, (s.fallDur + 0.5) * 1000),
      )
      spawnTimer = window.setTimeout(spawn, rand(SPAWN_MIN_MS, SPAWN_MAX_MS))
    }
    spawn()
    return () => {
      cancelled = true
      window.clearTimeout(spawnTimer)
      removeTimers.forEach((t) => window.clearTimeout(t))
      setSheep([])
    }
  }, [active])

  if (!active) return null

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {sheep.map((s) => {
        const within = (s.offset / 100) * SIDE_BAND_VW
        const left = s.side === "left" ? `${within}vw` : `calc(${100 - SIDE_BAND_VW}vw + ${within}vw)`
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              top: "-80px",
              left,
              animation: `mrmarko-fall ${s.fallDur}s linear forwards`,
            }}
          >
            <img
              src={SHEEP_URL}
              alt=""
              style={{
                width: s.size,
                height: s.size,
                display: "block",
                animation: `mrmarko-spin ${s.spinDur}s linear infinite ${s.spinReverse ? "reverse" : "normal"}`,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
