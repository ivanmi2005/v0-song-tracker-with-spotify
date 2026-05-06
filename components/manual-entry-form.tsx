"use client"

import { useState } from "react"
import Image from "next/image"
import { sileo } from "sileo"

const PRESETS = [
  {
    label: "AHOLÉ — Vegedream",
    data: {
      trackName: "AHOLÉ",
      artistName: "Vegedream",
      albumName: "AHOLÉ",
      coverUrl: "https://p16-sg.tiktokcdn.com/aweme/200x200/tos-alisg-v-2774/ooSRbwAfEEqUHKABu5otaDtB2ELzQvAfgCdFDZ.jpeg",
      externalUrl: "https://www.tiktok.com/music/AHOL%C3%89-7555599532496898065",
    },
  },
]

interface ManualData {
  trackName: string
  artistName: string
  albumName: string
  dateValue: string
  coverUrl: string
  externalUrl: string
}

const EMPTY: ManualData = {
  trackName: "",
  artistName: "",
  albumName: "",
  dateValue: "",
  coverUrl: "",
  externalUrl: "",
}

export function ManualEntryForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [manualData, setManualData] = useState<ManualData>(EMPTY)

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setManualData((prev) => ({ ...prev, ...preset.data }))
  }

  function set(field: keyof ManualData, value: string) {
    setManualData((prev) => ({ ...prev, [field]: value }))
  }

  function buildISODate(value: string): string {
    return new Date(`${value}T12:00:00`).toISOString()
  }

  function isDateValid(value: string): boolean {
    if (!value) return false
    const year = parseInt(value.split("-")[0])
    return year >= 2020 && year <= 2030
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { trackName, artistName, albumName, dateValue, coverUrl, externalUrl } = manualData
    if (!trackName || !artistName || !isDateValid(dateValue)) {
      sileo.warning({ title: "Rellena todos los campos obligatorios" })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/songs/add-with-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          trackName,
          artistName,
          albumName: albumName || undefined,
          customDate: buildISODate(dateValue),
          coverUrl: coverUrl || undefined,
          externalUrl: externalUrl || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        sileo.error({ title: data.error || "Error al añadir" })
      } else {
        sileo.success({ title: "Entrada manual creada" })
        setManualData(EMPTY)
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  const fieldClass =
    "w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.8rem]"
  const labelClass =
    "block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.6rem]"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Presets */}
      <div>
        <p className={labelClass}>Accesos rápidos</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="flex items-center gap-2 px-3 py-2 border border-border hover:border-foreground transition-colors"
            >
              {p.data.coverUrl && (
                <Image
                  src={p.data.coverUrl}
                  alt={p.data.trackName}
                  width={24}
                  height={24}
                  className="object-cover"
                  unoptimized
                />
              )}
              <span className="font-mono text-[0.65rem] text-foreground">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <label className={labelClass}>Nombre de la canción</label>
        <input
          type="text"
          value={manualData.trackName}
          onChange={(e) => set("trackName", e.target.value)}
          placeholder="ESCALOFRÍOS"
          className={fieldClass}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div>
        <label className={labelClass}>Artista</label>
        <input
          type="text"
          value={manualData.artistName}
          onChange={(e) => set("artistName", e.target.value)}
          placeholder="Mora"
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className={labelClass}>
          Álbum{" "}
          <span className="text-muted-foreground/50 normal-case tracking-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={manualData.albumName}
          onChange={(e) => set("albumName", e.target.value)}
          placeholder="TRAP CAMELLO"
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className={labelClass}>Fecha</label>
        <input
          type="date"
          value={manualData.dateValue}
          onChange={(e) => set("dateValue", e.target.value)}
          min="2020-01-01"
          max="2030-12-31"
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <hr className="border-border" />

      <div>
        <label className={labelClass}>
          URL de carátula{" "}
          <span className="text-muted-foreground/50 normal-case tracking-normal">(opcional)</span>
        </label>
        <div className="flex gap-2 items-start">
          <input
            type="url"
            value={manualData.coverUrl}
            onChange={(e) => set("coverUrl", e.target.value)}
            placeholder="https://..."
            className={`${fieldClass} flex-1`}
            disabled={isLoading}
          />
          {manualData.coverUrl && (
            <Image
              src={manualData.coverUrl}
              alt="Carátula"
              width={48}
              height={48}
              className="object-cover border border-border shrink-0"
              unoptimized
            />
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>
          URL externa{" "}
          <span className="text-muted-foreground/50 normal-case tracking-normal">(TikTok, YouTube, etc. — opcional)</span>
        </label>
        <input
          type="url"
          value={manualData.externalUrl}
          onChange={(e) => set("externalUrl", e.target.value)}
          placeholder="https://www.tiktok.com/music/..."
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={
          isLoading ||
          !manualData.trackName ||
          !manualData.artistName ||
          !isDateValid(manualData.dateValue)
        }
        className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {isLoading ? "Creando..." : "Crear entrada manual"}
      </button>
    </form>
  )
}
