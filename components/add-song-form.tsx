"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { sileo } from "sileo"

interface TrackPreview {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  external_urls: {
    spotify: string
  }
}

export function AddSongForm() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<TrackPreview | null>(null)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/songs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error buscando canción")
      }

      setPreview(data.track)
    } catch (err) {
      sileo.error({ title: err instanceof Error ? err.message : "Error desconocido" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackData: preview }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error añadiendo canción")
      }

      sileo.success({ title: "Canción añadida" })
      router.push("/")
      router.refresh()
    } catch (err) {
      sileo.error({ title: err instanceof Error ? err.message : "Error desconocido" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setInput("")
  }

  return (
    <>
      {preview && (
        <div className="fixed inset-0 bg-background/93 flex items-center justify-center z-50 p-6">
          <div className="bg-background border border-border p-10 max-w-[22rem] w-full text-center">
            <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Confirmar Canción
            </p>

            {preview.album.images[0] ? (
              <img
                src={preview.album.images[0].url}
                alt={preview.album.name}
                className="w-48 h-48 object-cover mx-auto mb-5"
              />
            ) : (
              <div className="w-48 h-48 bg-[oklch(0.93_0_0)] mx-auto mb-5 flex items-center justify-center">
                <span className="font-mono text-[0.6rem] text-muted-foreground">album art</span>
              </div>
            )}

            <h4 className="font-sans font-medium text-[1.4rem] tracking-[-0.02em] text-foreground mb-1">
              {preview.name}
            </h4>
            <p className="font-mono text-[0.75rem] text-muted-foreground mb-1">
              {preview.artists.map((a) => a.name).join(", ")}
            </p>
            <p className="font-mono text-[0.65rem] text-muted-foreground/70 italic mb-6">
              {preview.album.name}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-[0.85rem] border border-border bg-transparent text-foreground font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:bg-[oklch(0.96_0_0)] disabled:opacity-40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
              >
                {isLoading ? "Añadiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!preview && (
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label
              htmlFor="spotify-input"
              className="block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.6rem]"
            >
              Spotify URL or Song Title
            </label>
            <input
              id="spotify-input"
              type="text"
              placeholder='https://open.spotify.com/track/... or "Mora — ESCALOFRÍOS"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.8rem]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Buscando..." : "Buscar Canción"}
          </button>
        </form>
      )}
    </>
  )
}
