"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sileo } from "sileo"

export function ManualEntryForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [manualData, setManualData] = useState({
    trackName: "",
    artistName: "",
    albumName: "",
    day: "",
    month: "",
    year: "",
  })

  function buildISODate(day: string, month: string, year: string): string {
    const d = day.padStart(2, "0")
    const m = month.padStart(2, "0")
    return new Date(`${year}-${m}-${d}T12:00:00`).toISOString()
  }

  function isDateValid(day: string, month: string, year: string): boolean {
    if (!day || !month || !year) return false
    const n = Number(day), mo = Number(month), y = Number(year)
    return n >= 1 && n <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { trackName, artistName, albumName, day, month, year } = manualData
    if (!trackName || !artistName || !isDateValid(day, month, year)) {
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
          customDate: buildISODate(day, month, year),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        sileo.error({ title: data.error || "Error al añadir" })
      } else {
        sileo.success({ title: "Entrada manual creada" })
        router.push("/sync")
        router.refresh()
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  const dateInputs = (
    day: string, month: string, year: string,
    onChange: (field: "day" | "month" | "year", val: string) => void
  ) => (
    <div>
      <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
        Fecha
      </label>
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="number"
            value={day}
            onChange={(e) => onChange("day", e.target.value)}
            placeholder="DD"
            min={1}
            max={31}
            className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors text-center font-mono"
            disabled={isLoading}
          />
          <p className="text-[10px] text-center font-mono text-muted-foreground/50 mt-1">Día</p>
        </div>
        <div className="flex-1">
          <input
            type="number"
            value={month}
            onChange={(e) => onChange("month", e.target.value)}
            placeholder="MM"
            min={1}
            max={12}
            className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors text-center font-mono"
            disabled={isLoading}
          />
          <p className="text-[10px] text-center font-mono text-muted-foreground/50 mt-1">Mes</p>
        </div>
        <div className="flex-1">
          <input
            type="number"
            value={year}
            onChange={(e) => onChange("year", e.target.value)}
            placeholder="YYYY"
            min={2020}
            max={2030}
            className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors text-center font-mono"
            disabled={isLoading}
          />
          <p className="text-[10px] text-center font-mono text-muted-foreground/50 mt-1">Año</p>
        </div>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
          Canción <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={manualData.trackName}
          onChange={(e) => setManualData({ ...manualData, trackName: e.target.value })}
          placeholder="Nombre de la canción..."
          className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors"
          disabled={isLoading}
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
          Artista <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={manualData.artistName}
          onChange={(e) => setManualData({ ...manualData, artistName: e.target.value })}
          placeholder="Nombre del artista..."
          className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors"
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
          Álbum <span className="text-muted-foreground/40">(opcional)</span>
        </label>
        <input
          type="text"
          value={manualData.albumName}
          onChange={(e) => setManualData({ ...manualData, albumName: e.target.value })}
          placeholder="Nombre del álbum..."
          className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors"
          disabled={isLoading}
        />
      </div>

      {dateInputs(
        manualData.day,
        manualData.month,
        manualData.year,
        (field, val) => setManualData({ ...manualData, [field]: val })
      )}

      <button
        type="submit"
        disabled={
          isLoading ||
          !manualData.trackName ||
          !manualData.artistName ||
          !isDateValid(manualData.day, manualData.month, manualData.year)
        }
        className="w-full py-3 bg-foreground text-background font-mono text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Creando..." : "Crear entrada"}
      </button>
    </form>
  )
}
