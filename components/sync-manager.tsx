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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState<Record<string, string>>({})
  const [syncing, setSyncing] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchManualSongs()
  }, [])

  async function fetchManualSongs() {
    try {
      const res = await fetch("/api/songs/list?manual=true")
      const data = await res.json()
      setSongs(Array.isArray(data) ? data : [])
    } catch {
      sileo.error({ title: "Error cargando entradas manuales" })
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === songs.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(songs.map((s) => s.id)))
    }
  }

  async function syncSong(songId: string): Promise<boolean> {
    const query = searchInput[songId]?.trim()
    if (!query) {
      sileo.warning({ title: `Falta búsqueda para "${songs.find((s) => s.id === songId)?.track_name}"` })
      return false
    }

    setSyncing((prev) => new Set(prev).add(songId))
    try {
      const previewRes = await fetch("/api/songs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: query }),
      })
      const data = await previewRes.json()

      if (!previewRes.ok) {
        sileo.error({ title: `No encontrada: "${query}"` })
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
        sileo.error({ title: `Error sincronizando "${data.name}"` })
        return false
      }

      return true
    } catch {
      sileo.error({ title: "Error de conexión" })
      return false
    } finally {
      setSyncing((prev) => {
        const next = new Set(prev)
        next.delete(songId)
        return next
      })
    }
  }

  async function handleSyncSelected() {
    const toSync = Array.from(selected)
    const missingQuery = toSync.filter((id) => !searchInput[id]?.trim())
    if (missingQuery.length > 0) {
      const names = missingQuery.map((id) => songs.find((s) => s.id === id)?.track_name).join(", ")
      sileo.warning({ title: `Faltan búsquedas para: ${names}` })
      return
    }

    let successCount = 0
    const successIds: string[] = []

    for (const id of toSync) {
      const ok = await syncSong(id)
      if (ok) {
        successCount++
        successIds.push(id)
      }
    }

    if (successCount > 0) {
      sileo.success({ title: `${successCount} ${successCount === 1 ? "canción sincronizada" : "canciones sincronizadas"}` })
      setSongs((prev) => prev.filter((s) => !successIds.includes(s.id)))
      setSelected(new Set())
    }
  }

  async function handleSyncSingle(songId: string) {
    const ok = await syncSong(songId)
    if (ok) {
      sileo.success({ title: "Sincronizado con Spotify" })
      setSongs((prev) => prev.filter((s) => s.id !== songId))
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(songId)
        return next
      })
    }
  }

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
          No hay entradas manuales para sincronizar
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleAll}
          className="font-mono text-[0.6rem] tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          {selected.size === songs.length ? "Deseleccionar todo" : "Seleccionar todo"}
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between border border-border p-3">
          <p className="font-mono text-[0.6rem] text-muted-foreground">
            {selected.size} {selected.size === 1 ? "seleccionada" : "seleccionadas"}
          </p>
          <button
            onClick={handleSyncSelected}
            disabled={syncing.size > 0}
            className="py-[0.3rem] px-4 bg-foreground text-background font-mono text-[0.6rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
          >
            {syncing.size > 0 ? "Sincronizando..." : "Sincronizar seleccionadas"}
          </button>
        </div>
      )}

      <div>
        {songs.map((song) => (
          <div
            key={song.id}
            className={`py-4 border-b border-[oklch(0.93_0_0)] space-y-3 transition-colors ${
              selected.has(song.id) ? "bg-foreground/[0.03]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(song.id)}
                onChange={() => toggleSelect(song.id)}
                className="cursor-pointer accent-foreground shrink-0"
              />
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

            <div className="flex gap-2 pl-5">
              <input
                type="text"
                value={searchInput[song.id] || ""}
                onChange={(e) => setSearchInput({ ...searchInput, [song.id]: e.target.value })}
                placeholder="Buscar en Spotify..."
                className="flex-1 px-3 py-2 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.75rem]"
                disabled={syncing.has(song.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSyncSingle(song.id)
                }}
              />
              <button
                onClick={() => handleSyncSingle(song.id)}
                disabled={syncing.has(song.id)}
                className="px-4 py-2 bg-foreground text-background font-mono text-[0.6rem] tracking-[0.1em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
              >
                {syncing.has(song.id) ? "..." : "Sync"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
