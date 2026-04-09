"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sileo } from "sileo"

export function SpotifyDateForm() {
  const router = useRouter()
  const [spotifyInput, setSpotifyInput] = useState("")
  const [spotifyDate, setSpotifyDate] = useState({ day: "", month: "", year: "" })
  const [preview, setPreview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  function buildISODate(day: string, month: string, year: string): string {
    const d = day.padStart(2, "0")
    const m = month.padStart(2, "0")
    return new Date(`${year}-${m}-${d}T12:00:00`).toISOString()
  }

  function isDateValid(day: string, month: string, year: string): boolean {
    if (!day || !month || !year) return false
    const n = Number(day),
      mo = Number(month),
      y = Number(year)
    return n >= 1 && n <= 31 && mo >= 1 && mo <= 12 && y >= 2020 && y <= 2030
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!spotifyInput.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/songs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: spotifyInput }),
      })
      const data = await res.json()
      if (!res.ok) {
        sileo.error({ title: data.error || "Canción no encontrada" })
      } else {
        setPreview(data)
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirm() {
    if (!preview || !isDateValid(spotifyDate.day, spotifyDate.month, spotifyDate.year)) {
      sileo.warning({ title: "Introduce una fecha válida" })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/songs/add-with-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: preview.id,
          customDate: buildISODate(spotifyDate.day, spotifyDate.month, spotifyDate.year),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        sileo.error({ title: data.error || "Error al añadir" })
      } else {
        sileo.success({ title: "Canción añadida" })
        router.push("/")
        router.refresh()
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  const dateInputs = (
    day: string,
    month: string,
    year: string,
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
    <>
      {!preview ? (
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
              URL o búsqueda de Spotify
            </label>
            <input
              type="text"
              value={spotifyInput}
              onChange={(e) => setSpotifyInput(e.target.value)}
              placeholder="Pega URL de Spotify o busca..."
              className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!spotifyInput.trim() || isLoading}
            className="w-full py-3 bg-foreground text-background font-mono text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Buscando..." : "Buscar canción"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-6 border border-border">
            {preview.album?.images?.[0]?.url && (
              <img
                src={preview.album.images[0].url || "/placeholder.svg"}
                alt={preview.album?.name || "Album"}
                className="w-40 h-40 mx-auto mb-4 object-cover"
              />
            )}
            <h3 className="text-xl font-light mb-1">{preview.name}</h3>
            <p className="text-sm text-muted-foreground">
              {Array.isArray(preview.artists) ? preview.artists.map((a: any) => a.name).join(", ") : "Artista desconocido"}
            </p>
          </div>

          {dateInputs(spotifyDate.day, spotifyDate.month, spotifyDate.year, (field, val) =>
            setSpotifyDate({ ...spotifyDate, [field]: val })
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={isLoading}
              className="flex-1 py-3 border border-border bg-transparent font-mono text-sm uppercase tracking-widest hover:bg-secondary/30 disabled:opacity-50 transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !isDateValid(spotifyDate.day, spotifyDate.month, spotifyDate.year)}
              className="flex-1 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Añadiendo..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
