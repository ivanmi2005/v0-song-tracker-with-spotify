"use client"

import { useEffect, useRef, useState } from "react"

interface OrbitSlot {
  id: number
  radius: number // px
  size: number // px
  duration: number // s
  delay: number // s (negative → fase inicial)
  reverse: boolean
  cover: string
  fade: boolean
}

const SLOT_COUNT = 11
const FALLBACK_FIGURE = "/ruggeri-cutout.png"

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface CoverOrbitProps {
  covers: string[]
  imageSrc?: string
}

export function CoverOrbit({ covers, imageSrc = "/ruggeri-thumbsup.webp" }: CoverOrbitProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [slots, setSlots] = useState<OrbitSlot[]>([])
  const [figureSrc, setFigureSrc] = useState(imageSrc)

  // Construir los slots tras montar (solo cliente → sin desajuste de hidratación).
  useEffect(() => {
    if (covers.length === 0) {
      setSlots([])
      return
    }

    const measure = () => {
      const w = sceneRef.current?.clientWidth ?? 600
      const maxR = Math.max(120, w / 2 - 28)
      const minR = maxR * 0.55
      setSlots((prev) => {
        const built: OrbitSlot[] = []
        for (let i = 0; i < SLOT_COUNT; i++) {
          built.push({
            id: i,
            radius: rand(minR, maxR),
            size: rand(34, 60),
            duration: rand(16, 30),
            delay: -rand(0, 30),
            reverse: i % 2 === 0,
            cover: prev[i]?.cover ?? pick(covers),
            fade: false,
          })
        }
        return built
      })
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [covers])

  // Intercambiar la portada de un slot aleatorio de forma continua.
  useEffect(() => {
    if (covers.length === 0) return
    const interval = setInterval(() => {
      setSlots((prev) => {
        if (prev.length === 0) return prev
        const i = Math.floor(Math.random() * prev.length)
        const next = [...prev]
        next[i] = { ...next[i], cover: pick(covers), fade: true }
        return next
      })
      // Quitar el flag de fade un instante después → la nueva portada entra con fundido.
      setTimeout(() => {
        setSlots((prev) => prev.map((s) => (s.fade ? { ...s, fade: false } : s)))
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
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        // @ts-expect-error CSS custom property
        "--orbit-cy": "42%",
      }}
    >
      {slots.map((s) => (
        <div
          key={s.id}
          className="mrw-orbit-cover"
          style={{
            width: s.size,
            height: s.size,
            marginTop: -s.size / 2,
            marginLeft: -s.size / 2,
            // @ts-expect-error CSS custom property
            "--r": `${s.radius}px`,
            animation: `mrw-orbit ${s.duration}s linear ${s.delay}s infinite ${s.reverse ? "reverse" : "normal"}, mrw-orbit-z ${s.duration}s step-end ${s.delay}s infinite ${s.reverse ? "reverse" : "normal"}`,
          }}
        >
          <img
            src={s.cover || "/placeholder.svg"}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: s.fade ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          />
        </div>
      ))}

      {/* Figura central con filtro azul */}
      <div style={{ position: "relative", zIndex: 3, height: "100%", display: "flex", alignItems: "flex-end" }}>
        <img
          src={figureSrc}
          alt="Matteo Ruggeri"
          onError={() => {
            if (figureSrc !== FALLBACK_FIGURE) setFigureSrc(FALLBACK_FIGURE)
          }}
          style={{ height: "100%", width: "auto", display: "block", objectFit: "contain" }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--mrw-blue)",
            mixBlendMode: "color",
            opacity: 0.8,
            WebkitMaskImage: `url(${figureSrc})`,
            maskImage: `url(${figureSrc})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center bottom",
            maskPosition: "center bottom",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  )
}
