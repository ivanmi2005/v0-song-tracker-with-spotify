"use client"

import { useState } from "react"
import { sileo } from "sileo"

export function SpotifyDateForm() {
  const [spotifyInput, setSpotifyInput] = useState("")
  const [dateValue, setDateValue] = useState("")
  const [preview, setPreview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  function buildISODate(value: string): string {
    return new Date(`${value}T12:00:00`).toISOString()
  }

  function isDateValid(value: string): boolean {
    if (!value) return false
    const year = parseInt(value.split("-")[0])
    return year >= 2020 && year <= 2030
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
        setPreview(data.track)
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirm() {
    if (!preview || !isDateValid(dateValue)) {
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
          customDate: buildISODate(dateValue),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        sileo.error({ title: data.error || "Error al añadir" })
      } else {
        sileo.success({ title: "Canción añadida" })
        setPreview(null)
        setSpotifyInput("")
        setDateValue("")
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!preview ? (
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.6rem]">
              Spotify URL
            </label>
            <input
              type="text"
              value={spotifyInput}
              onChange={(e) => setSpotifyInput(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.8rem]"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!spotifyInput.trim() || isLoading}
            className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Buscando..." : "Buscar canción"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-6 border border-border">
            {preview.album?.images?.[0]?.url && (
              <img
                src={preview.album.images[0].url}
                alt={preview.album?.name || "Album"}
                className="w-40 h-40 mx-auto mb-4 object-cover"
              />
            )}
            <h3 className="font-sans font-medium text-[1.2rem] tracking-[-0.02em] mb-1">
              {preview.name}
            </h3>
            <p className="font-mono text-[0.75rem] text-muted-foreground">
              {Array.isArray(preview.artists)
                ? preview.artists.map((a: any) => a.name).join(", ")
                : "Artista desconocido"}
            </p>
          </div>

          <div>
            <label className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.6rem]">
              Fecha
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              min="2020-01-01"
              max="2030-12-31"
              className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-foreground transition-colors font-mono text-[0.8rem]"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={isLoading}
              className="flex-1 py-[0.85rem] border border-border bg-transparent text-foreground font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:bg-[oklch(0.96_0_0)] disabled:opacity-40 transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !isDateValid(dateValue)}
              className="flex-1 py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
            >
              {isLoading ? "Añadiendo..." : "Añadir con esta fecha"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
