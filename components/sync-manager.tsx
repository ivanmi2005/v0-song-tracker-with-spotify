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

interface SpotifyResult {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  external_urls: { spotify: string }
  preview_url: string | null
}

type Step = "list" | "search" | "confirm"

export function SyncManager() {
  const [songs, setSongs] = useState<ManualSong[]>([])
  const [loading, setLoading] = useState(true)

  // Active flow
  const [step, setStep] = useState<Step>("list")
  const [activeSong, setActiveSong] = useState<ManualSong | null>(null)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [spotifyResult, setSpotifyResult] = useState<SpotifyResult | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetchManualSongs()
  }, [])

  async function fetchManualSongs() {
    setLoading(true)
    try {
      const res = await fetch("/api/songs/list")
      const data = await res.json()
      const manual = Array.isArray(data)
        ? data.filter((s: any) => s.spotify_track_id?.startsWith("manual-"))
        : []
      setSongs(manual)
    } catch {
      sileo.error({ title: "Error cargando canciones" })
    } finally {
      setLoading(false)
    }
  }

  function startSync(song: ManualSong) {
    setActiveSong(song)
    setQuery(`${song.track_name} ${song.artist_name}`)
    setSpotifyResult(null)
    setStep("search")
  }

  function reset() {
    setActiveSong(null)
    setQuery("")
    setSpotifyResult(null)
    setStep("list")
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSpotifyResult(null)
    try {
      const res = await fetch("/api/songs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: query }),
      })
      const data = await res.json()
      if (!res.ok || !data?.id) {
        sileo.error({ title: "No se encontró ninguna canción" })
        return
      }
      setSpotifyResult(data)
      setStep("confirm")
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setSearching(false)
    }
  }

  async function handleConfirm() {
    if (!activeSong || !spotifyResult) return
    setConfirming(true)
    try {
      const res = await fetch("/api/songs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualSongId: activeSong.id,
          spotifyTrackId: spotifyResult.id,
          spotifyData: {
            track_name: spotifyResult.name,
            artist_name: spotifyResult.artists?.map((a) => a.name).join(", ") || "",
            album_name: spotifyResult.album?.name || null,
            album_image_url: spotifyResult.album?.images?.[0]?.url || null,
            preview_url: spotifyResult.preview_url || null,
            spotify_url: spotifyResult.external_urls?.spotify || `https://open.spotify.com/track/${spotifyResult.id}`,
          },
        }),
      })

      if (!res.ok) {
        sileo.error({ title: "Error al sincronizar" })
        return
      }

      sileo.success({ title: `"${spotifyResult.name}" sincronizada` })
      setSongs((prev) => prev.filter((s) => s.id !== activeSong.id))
      reset()
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setConfirming(false)
    }
  }

  // --- STEP: LIST ---
  if (step === "list") {
    if (loading) {
      return <p className="text-center text-muted-foreground py-12 font-mono text-sm">Cargando...</p>
    }

    if (songs.length === 0) {
      return (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">No hay entradas manuales pendientes</p>
          <a
            href="/manual"
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Crear una entrada manual →
          </a>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-6">
          {songs.length} {songs.length === 1 ? "entrada" : "entradas"} pendientes
        </p>
        {songs.map((song) => (
          <div
            key={song.id}
            className="flex items-center justify-between gap-4 py-4 border-b border-border/40"
          >
            <div className="min-w-0">
              <p className="font-normal text-foreground truncate">{song.track_name}</p>
              <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
              <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                {new Date(song.added_at).toLocaleDateString("es-ES")}
              </p>
            </div>
            <button
              onClick={() => startSync(song)}
              className="shrink-0 py-2 px-4 border border-border font-mono text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors bg-transparent"
            >
              Sincronizar
            </button>
          </div>
        ))}
      </div>
    )
  }

  // --- STEP: SEARCH ---
  if (step === "search") {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Entrada manual</p>
          <p className="font-normal text-foreground">{activeSong?.track_name}</p>
          <p className="text-sm text-muted-foreground">{activeSong?.artist_name}</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3 block">
              Buscar en Spotify
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre canción + artista..."
              className="w-full bg-transparent border-b border-border py-3 focus:outline-none focus:border-foreground transition-colors"
              autoFocus
              disabled={searching}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-3 border border-border bg-transparent font-mono text-sm uppercase tracking-widest hover:bg-secondary/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!query.trim() || searching}
              className="flex-1 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // --- STEP: CONFIRM ---
  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Entrada manual</p>
        <p className="text-sm text-foreground">{activeSong?.track_name}</p>
        <p className="text-xs text-muted-foreground">{activeSong?.artist_name}</p>
      </div>

      {spotifyResult && (
        <div className="text-center py-6 border border-border space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Resultado en Spotify</p>
          {spotifyResult.album?.images?.[0]?.url && (
            <img
              src={spotifyResult.album.images[0].url}
              alt={spotifyResult.album.name}
              className="w-32 h-32 mx-auto object-cover"
            />
          )}
          <div>
            <p className="font-normal text-foreground text-lg">{spotifyResult.name}</p>
            <p className="text-sm text-muted-foreground">
              {spotifyResult.artists?.map((a) => a.name).join(", ")}
            </p>
            <p className="text-xs text-muted-foreground/60 italic mt-1">{spotifyResult.album?.name}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-center text-muted-foreground">
        ¿Es esta la canción correcta? Se reemplazará la entrada manual.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => setStep("search")}
          disabled={confirming}
          className="flex-1 py-3 border border-border bg-transparent font-mono text-sm uppercase tracking-widest hover:bg-secondary/30 disabled:opacity-50 transition-colors"
        >
          No, buscar otra
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 py-3 bg-foreground text-background font-mono text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {confirming ? "Sincronizando..." : "Confirmar"}
        </button>
      </div>
    </div>
  )
}
