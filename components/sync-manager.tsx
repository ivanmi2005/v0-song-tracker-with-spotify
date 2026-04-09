"use client"

import { useState, useEffect } from "react"
import { sileo } from "sileo"

interface ManualSong {
  id: string
  track_name: string
  artist_name: string
  album_name: string | null
  added_at: string
  spotify_track_id: string
}

export function SyncManager() {
  const [songs, setSongs] = useState<ManualSong[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchManualSongs()
  }, [])

  async function fetchManualSongs() {
    try {
      const res = await fetch("/api/songs/list")
      const data = await res.json()
      const manualSongs = Array.isArray(data)
        ? data.filter((s) => s.spotify_track_id?.startsWith("manual-"))
        : []
      setSongs(manualSongs)
    } catch {
      sileo.error({ title: "Error cargando entradas manuales" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(songId: string) {
    const query = searchInput[songId]
    if (!query?.trim()) {
      sileo.warning({ title: "Introduce un texto de búsqueda" })
      return
    }

    setSearching(songId)
    try {
      const res = await fetch("/api/songs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: query }),
      })
      const data = await res.json()

      if (!res.ok) {
        sileo.error({ title: "Canción no encontrada" })
        return
      }

      // Update the manual song in the database with Spotify data
      const updateRes = await fetch("/api/songs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualSongId: songId,
          spotifyTrackId: data.id,
          spotifyData: {
            track_name: data.name,
            artist_name: data.artists?.map((a: any) => a.name).join(", ") || "",
            album_name: data.album?.name || null,
            album_image_url: data.album?.images?.[0]?.url || null,
            preview_url: data.preview_url || null,
            spotify_url: data.external_urls?.spotify || `https://open.spotify.com/track/${data.id}`,
          },
        }),
      })

      if (!updateRes.ok) {
        sileo.error({ title: "Error sincronizando" })
        return
      }

      sileo.success({ title: "Sincronizado con Spotify" })
      setSongs(songs.filter((s) => s.id !== songId))
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setSearching(null)
    }
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Cargando entradas manuales...</p>
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No hay entradas manuales para sincronizar</p>
        <a href="/manual" className="text-sm font-mono tracking-widest uppercase hover:underline">
          Crear una entrada manual
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground/60 italic">
        Busca cada entrada manual en Spotify para sincronizarla con datos reales
      </p>

      <div className="space-y-4">
        {songs.map((song) => (
          <div key={song.id} className="border border-border p-4 space-y-4">
            <div>
              <h3 className="font-normal text-foreground truncate">{song.track_name}</h3>
              <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
              {song.album_name && <p className="text-xs text-muted-foreground/70 italic">{song.album_name}</p>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput[song.id] || ""}
                onChange={(e) => setSearchInput({ ...searchInput, [song.id]: e.target.value })}
                placeholder="Buscar en Spotify..."
                className="flex-1 bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                disabled={searching === song.id}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearch(song.id)
                }}
              />
              <button
                onClick={() => handleSearch(song.id)}
                disabled={searching === song.id}
                className="py-2 px-4 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {searching === song.id ? "Buscando..." : "Sincronizar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
