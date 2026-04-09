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
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<TrackPreview | null>(null)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/songs/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackData: preview }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error añadiendo canción")
      }

      sileo.success({ title: "Song added" })
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
    setError(null)
  }

  return (
    <>
      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full p-8 border border-black">
            <h3 className="text-xs font-mono tracking-widest uppercase mb-6 text-center">Confirmar Canción</h3>

            <div className="flex flex-col items-center mb-6">
              {preview.album.images[0] && (
                <img
                  src={preview.album.images[0].url || "/placeholder.svg"}
                  alt={preview.album.name}
                  className="w-48 h-48 object-cover mb-4"
                />
              )}
              <h4 className="text-2xl font-light text-center mb-2">{preview.name}</h4>
              <p className="text-sm text-neutral-600 font-mono text-center mb-1">
                {preview.artists.map((a) => a.name).join(", ")}
              </p>
              <p className="text-xs text-neutral-400 font-mono text-center">{preview.album.name}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-3 bg-white text-black border border-black font-mono text-xs tracking-wide uppercase hover:bg-neutral-100 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 py-3 bg-black text-white font-mono text-xs tracking-wide uppercase hover:bg-neutral-800 disabled:opacity-50 transition-colors"
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
              className="block text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3"
            >
              Spotify URL or Song Title
            </label>
            <input
              id="spotify-input"
              type="text"
              placeholder='https://open.spotify.com/track/... or "Mora - ESCALOFRÍOS"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-foreground text-background font-mono text-sm tracking-wide uppercase hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Buscando..." : "Buscar Canción"}
          </button>
        </form>
      )}
    </>
  )
}
