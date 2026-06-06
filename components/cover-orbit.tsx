"use client"

import { useEffect, useRef, useState } from "react"

const SLOT_COUNT = 16
const FALLBACK_FIGURE = "/ruggeri-cutout.png"
const TRIGGER = "ruggeri"
const HEART_MS = 6000
const FALLBACK_MASK = "https://em-content.zobj.net/source/google/439/ewe_1f411.png"

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface Geom {
  radius: number
  speed: number // rad/s
  phase: number // rad
  wob: number // amplitud wobble (px)
  wsp: number // velocidad wobble (rad/s)
  heartX: number
  heartY: number
}

interface CoverState {
  cover: string
  fade: boolean
  size: number
}

interface CoverOrbitProps {
  covers: string[]
  imageSrc?: string
  mrMarkoActive?: boolean
}

export function CoverOrbit({ covers, imageSrc = "/ruggeri-thumbsup.webp", mrMarkoActive = false }: CoverOrbitProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const elRefs = useRef<(HTMLDivElement | null)[]>([])
  const geomRef = useRef<Geom[]>([])
  const modeRef = useRef<"circle" | "heart">("circle")
  const [coverStates, setCoverStates] = useState<CoverState[]>([])
  const [figureSrc, setFigureSrc] = useState(imageSrc)
  const [maskSrc, setMaskSrc] = useState("/sheep-mask.webp")

  // Geometría (círculo + puntos del corazón). Solo cliente → sin hidratación.
  useEffect(() => {
    if (covers.length === 0) {
      geomRef.current = []
      setCoverStates([])
      return
    }

    const measure = () => {
      const el = sceneRef.current
      const w = el?.clientWidth ?? 600
      const h = el?.clientHeight ?? 380
      const maxR = Math.max(120, w / 2 - 24)
      const minR = maxR * 0.42

      // Puntos del corazón (paramétrico), repartidos uniformemente.
      const pts: { hx: number; hy: number }[] = []
      for (let i = 0; i < SLOT_COUNT; i++) {
        const tt = (i / SLOT_COUNT) * Math.PI * 2
        const hx = 16 * Math.pow(Math.sin(tt), 3)
        const hy = 13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt)
        pts.push({ hx, hy })
      }
      const xs = pts.map((p) => p.hx)
      const ys = pts.map((p) => p.hy)
      const minx = Math.min(...xs)
      const maxx = Math.max(...xs)
      const miny = Math.min(...ys)
      const maxy = Math.max(...ys)
      const ccx = (minx + maxx) / 2
      const ccy = (miny + maxy) / 2
      const scale = Math.min((h * 0.72) / (maxy - miny), (w * 0.82) / (maxx - minx))

      const geom: Geom[] = []
      for (let i = 0; i < SLOT_COUNT; i++) {
        const ring = i % 4
        const band = ring / 3
        geom.push({
          radius: minR + band * (maxR - minR) + rand(-10, 10),
          speed: (2 * Math.PI) / (24 + ring * 4), // misma dirección, distinta velocidad por anillo
          phase: (i / SLOT_COUNT) * Math.PI * 2, // reparto angular uniforme
          wob: rand(4, 9),
          wsp: (2 * Math.PI) / rand(4, 7),
          heartX: (pts[i].hx - ccx) * scale,
          heartY: -(pts[i].hy - ccy) * scale, // invertir Y (pantalla)
        })
      }
      geomRef.current = geom

      setCoverStates((prev) =>
        Array.from({ length: SLOT_COUNT }, (_, i) => prev[i] ?? { cover: pick(covers), fade: false, size: rand(28, 54) }),
      )
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [covers])

  // Bucle de animación: círculo ↔ corazón con morph suave + wobble continuo.
  useEffect(() => {
    if (coverStates.length === 0) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (reduce) {
      geomRef.current.forEach((g, i) => {
        const el = elRefs.current[i]
        if (el) el.style.transform = `translate(${Math.cos(g.phase) * g.radius}px, ${Math.sin(g.phase) * g.radius}px)`
      })
      return
    }

    let raf = 0
    const start = performance.now()
    const pos = geomRef.current.map(() => ({ x: 0, y: 0, init: false }))

    const frame = (now: number) => {
      const t = (now - start) / 1000
      const heart = modeRef.current === "heart"
      const geom = geomRef.current
      for (let i = 0; i < geom.length; i++) {
        const g = geom[i]
        let bx: number
        let by: number
        if (heart) {
          bx = g.heartX
          by = g.heartY
        } else {
          const a = g.phase + t * g.speed
          bx = Math.cos(a) * g.radius
          by = Math.sin(a) * g.radius
        }
        const tx = bx + Math.cos(t * g.wsp) * g.wob
        const ty = by + Math.sin(t * g.wsp) * g.wob
        const p = pos[i]
        if (!p.init) {
          p.x = tx
          p.y = ty
          p.init = true
        } else {
          p.x += (tx - p.x) * 0.07
          p.y += (ty - p.y) * 0.07
        }
        const el = elRefs.current[i]
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [coverStates.length])

  // Easter egg: teclear "ruggeri" forma un corazón temporal.
  useEffect(() => {
    let buf = ""
    let timer = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-TRIGGER.length)
      if (buf === TRIGGER) {
        buf = ""
        modeRef.current = "heart"
        clearTimeout(timer)
        timer = window.setTimeout(() => {
          modeRef.current = "circle"
        }, HEART_MS)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearTimeout(timer)
    }
  }, [])

  // Intercambio continuo de portadas (constante y aleatorio).
  useEffect(() => {
    if (covers.length === 0) return
    const interval = setInterval(() => {
      setCoverStates((prev) => {
        if (prev.length === 0) return prev
        const i = Math.floor(Math.random() * prev.length)
        const next = [...prev]
        next[i] = { ...next[i], cover: pick(covers), fade: true }
        return next
      })
      setTimeout(() => {
        setCoverStates((prev) => prev.map((s) => (s.fade ? { ...s, fade: false } : s)))
      }, 60)
    }, 3000)
    return () => clearInterval(interval)
  }, [covers])

  return (
    <div
      ref={sceneRef}
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(300px, 78vw, 440px)",
        margin: "0 auto",
        isolation: "isolate",
      }}
    >
      {coverStates.map((c, i) => (
        <div
          key={i}
          ref={(el) => {
            elRefs.current[i] = el
          }}
          className="mrw-orbit-cover"
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: c.size,
            height: c.size,
            marginTop: -c.size / 2,
            marginLeft: -c.size / 2,
            zIndex: 5,
          }}
        >
          <img
            src={c.cover || "/placeholder.svg"}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: c.fade ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          />
        </div>
      ))}

      {/* Figura: cuerpo completo por DETRÁS de las portadas (z2) y cabeza por
          DELANTE (z7) con borde inferior degradado para que no haya corte recto. */}
      <img
        src={figureSrc}
        alt="Matteo Ruggeri"
        onError={() => {
          if (figureSrc !== FALLBACK_FIGURE) setFigureSrc(FALLBACK_FIGURE)
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height: "100%",
          width: "auto",
          display: "block",
          objectFit: "contain",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <img
        src={figureSrc}
        alt=""
        aria-hidden="true"
        onError={() => {
          if (figureSrc !== FALLBACK_FIGURE) setFigureSrc(FALLBACK_FIGURE)
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height: "100%",
          width: "auto",
          display: "block",
          objectFit: "contain",
          zIndex: 7,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 32%, transparent 48%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 32%, transparent 48%)",
          pointerEvents: "none",
        }}
      />

      {/* Máscara de oveja sobre la cara cuando MrMarko está activo (z8 > cabeza z7). */}
      {mrMarkoActive && (
        <img
          src={maskSrc}
          alt=""
          aria-hidden="true"
          onError={() => {
            if (maskSrc !== FALLBACK_MASK) setMaskSrc(FALLBACK_MASK)
          }}
          style={{
            position: "absolute",
            top: "-8%",
            left: "39.5%",
            transform: "translateX(-50%)",
            height: "47.5%",
            width: "auto",
            maxWidth: "90%",
            objectFit: "contain",
            zIndex: 8,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  )
}

