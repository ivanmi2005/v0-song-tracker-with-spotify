"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { sileo } from "sileo"

interface ManualSong {
  id: string
  track_name: string
  artist_name: string
  album_name: string | null
  album_image_url: string | null
  spotify_url: string | null
  added_at: string
  spotify_track_id: string
}

type SyncMode = "spotify" | "cover"

interface SongState {
  mode: SyncMode
  spotifyQuery: string
  coverUrl: string
  externalUrl: string
}

function defaultState(): SongState {
  return { mode: "spotify", spotifyQuery: "", coverUrl: "", externalUrl: "" }
}

export function SyncManager() {
  const [songs, setSongs] = useState<ManualSong[]>([])
  const [loading, setLoading] = useState(true)
  const [songState, setSongState] = useState<Record<string, SongState>>({})
  const [syncing, setSyncing] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchManualSongs()
  }, [])

  async function fetchManualSongs() {
    try {
      const res = await fetch("/api/songs/list?manual=true")
      const data = await res.json()
      const list: ManualSong[] = Array.isArray(data) ? data : []
      setSongs(list)
      // init state for each song, pre-filling cover if already set
      setSongState(
        Object.fromEntries(
          list.map((s) => [
            s.id,
            {
              mode: (s.album_image_url ? "cover" : "spotify") as SyncMode,
              spotifyQuery: s.track_name + " " + s.artist_name,
              coverUrl: s.album_image_url || "",
              externalUrl:
                s.spotify_url && !s.spotify_url.startsWith("#manual-entry")
                  ? s.spotify_url
                  : "",
            },
          ])
        )
      )
    } catch {
      sileo.error({ title: "Error cargando entradas manuales" })
    } finally {
      setLoading(false)
    }
  }

  function updateState(id: string, patch: Partial<SongState>) {
    setSongState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function setSyncing_(id: string, val: boolean) {
    setSyncing((prev) => {
      const next = new Set(prev)
      val ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function syncSong(songId: string): Promise<boolean> {
    const state = songState[songId] || defaultState()
    setSyncing_(songId, true)

    try {
      if (state.mode === "cover") {
        // No-Spotify path: just update cover + optional external URL
        if (!state.coverUrl.trim()) {
          sileo.warning({ title: "Introduce una URL de carátula" })
          return false
        }
        const res = await fetch("/api/songs/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manualSongId: songId,
            coverOnly: true,
            coverUrl: state.coverUrl.trim(),
            externalUrl: state.externalUrl.trim() || undefined,
          }),
        })
        if (!res.ok) {
          sileo.error({ title: "Error actualizando carátula" })
          return false
        }
        return true
      } else {
        // Spotify search path
        const query = state.spotifyQuery.trim()
        if (!query) {
          sileo.warning({ title: "Introduce una búsqueda de Spotify" })
          return false
        }
        const previewRes = await fetch("/api/songs/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query }),
        })
        const data = await previewRes.json()
        if (!previewRes.ok) {
          sileo.error({ title: `No encontrada en Spotify: "${query}"` })
          return false
        }
        const updateRes = await fetch("/api/songs/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manualSongId: songId,
            spotifyTrackId: data.id,
            spotifyData: {
              track_name: data.name,
              artist_name: data.artists?.map((a: { name: string }) => a.name).join(", ") || "",
              album_name: data.album?.name || null,
              album_image_url: data.album?.images?.[0]?.url || null,
              preview_url: data.preview_url || null,
              spotify_url: data.external_urls?.spotify || `https://open.spotify.com/track/${data.id}`,
            },
          }),
        })
        if (!updateRes.ok) {
          sileo.error({ title: "Error sincronizando con Spotify" })
          return false
        }
        return true
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
      return false
    } finally {
      setSyncing_(songId, false)
    }
  }

  async function handleSync(songId: string) {
    const ok = await syncSong(songId)
    if (ok) {
      const state = songState[songId]
      sileo.success({
        title: state.mode === "cover" ? "Carátula actualizada" : "Sincronizado con Spotify",
      })
      // Remove from list only on full Spotify sync; for cover-only keep it visible but update
      if (state.mode === "spotify") {
        setSongs((prev) => prev.filter((s) => s.id !== songId))
      } else {
        setSongs((prev) =>
          prev.map((s) =>
            s.id === songId ? { ...s, album_image_url: state.coverUrl } : s
          )
        )
      }
    }
  }

  const labelClass =
    "block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.4rem]"
  const fieldClass =
    "w-full px-3 py-2 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.75rem]"

  if (loading) {
    return (
      <p className="font-mono text-[0.65rem] text-muted-foreground py-8 text-center">
        Cargando entradas manuales...
      </p>
    )
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-[0.65rem] text-muted-foreground mb-4">
          No hay entradas manuales pendientes
        </p>
        <a
          href="/admin"
          className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Crear una entrada manual
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-0 divide-y divide-[oklch(0.93_0_0)]">
      {songs.map((song) => {
        const state = songState[song.id] || defaultState()
        const isSyncing = syncing.has(song.id)

        return (
          <div key={song.id} className="py-5 space-y-4">
            {/* Song info row */}
            <div className="flex items-center gap-3">
              {song.album_image_url ? (
                <Image
                  src={song.album_image_url}
                  alt={song.track_name}
                  width={40}
                  height={40}
                  className="object-cover shrink-0 border border-border"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 bg-[oklch(0.95_0_0)] shrink-0 border border-border flex items-center justify-center">
                  <span className="font-mono text-[0.5rem] text-muted-foreground">SIN</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-[0.85rem] text-foreground truncate">
                  {song.track_name}
                </p>
                <p className="font-mono text-[0.65rem] text-muted-foreground truncate">
                  {song.artist_name}
                  {song.album_name && ` — ${song.album_name}`}
                </p>
              </div>
              <span className="font-mono text-[0.55rem] tracking-[0.12em] uppercase px-2 py-1 text-[oklch(0.55_0.12_55)] bg-[oklch(0.96_0.03_85)] shrink-0">
                Pendiente
              </span>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-0 border border-border w-fit">
              <button
                type="button"
                onClick={() => updateState(song.id, { mode: "spotify" })}
                className={`px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${
                  state.mode === "spotify"
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
                disabled={isSyncing}
              >
                Spotify
              </button>
              <button
                type="button"
                onClick={() => updateState(song.id, { mode: "cover" })}
                className={`px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors border-l border-border ${
                  state.mode === "cover"
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
                disabled={isSyncing}
              >
                Sin Spotify
              </button>
            </div>

            {/* Spotify mode inputs */}
            {state.mode === "spotify" && (
              <div className="space-y-2">
                <label className={labelClass}>Buscar en Spotify</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state.spotifyQuery}
                    onChange={(e) => updateState(song.id, { spotifyQuery: e.target.value })}
                    placeholder="Nombre — Artista"
                    className={`${fieldClass} flex-1`}
                    disabled={isSyncing}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSync(song.id) }}
                  />
                  <button
                    onClick={() => handleSync(song.id)}
                    disabled={isSyncing || !state.spotifyQuery.trim()}
                    className="px-4 py-2 bg-foreground text-background font-mono text-[0.6rem] tracking-[0.1em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
                  >
                    {isSyncing ? "..." : "Sync"}
                  </button>
                </div>
              </div>
            )}

            {/* Cover-only mode inputs */}
            {state.mode === "cover" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>URL de carátula</label>
                  <div className="flex gap-2 items-start">
                    <input
                      type="url"
                      value={state.coverUrl}
                      onChange={(e) => updateState(song.id, { coverUrl: e.target.value })}
                      placeholder="https://..."
                      className={`${fieldClass} flex-1`}
                      disabled={isSyncing}
                    />
                    {state.coverUrl && (
                      <Image
                        src={state.coverUrl}
                        alt="Preview"
                        width={40}
                        height={40}
                        className="object-cover border border-border shrink-0"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    URL externa{" "}
                    <span className="normal-case tracking-normal">(opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={state.externalUrl}
                    onChange={(e) => updateState(song.id, { externalUrl: e.target.value })}
                    placeholder="https://www.tiktok.com/music/..."
                    className={fieldClass}
                    disabled={isSyncing}
                  />
                </div>
                <button
                  onClick={() => handleSync(song.id)}
                  disabled={isSyncing || !state.coverUrl.trim()}
                  className="w-full py-[0.7rem] bg-foreground text-background font-mono text-[0.6rem] tracking-[0.1em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
                >
                  {isSyncing ? "Guardando..." : "Guardar carátula"}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
