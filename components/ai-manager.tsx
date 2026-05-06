"use client"

import { useState, useEffect } from "react"
import { sileo } from "sileo"

interface Song {
  id: string
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_image_url: string | null
  is_ai: boolean
}

export function AiManager() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/songs/list?all=true")
      const data = await res.json()

      // Deduplicate by spotify_track_id, keep first occurrence (most recent)
      const uniqueMap = new Map<string, Song>()
      for (const s of data as Song[]) {
        if (!uniqueMap.has(s.spotify_track_id)) uniqueMap.set(s.spotify_track_id, s)
      }
      setSongs(Array.from(uniqueMap.values()))
    } catch {
      sileo.error({ title: "Error cargando canciones" })
    } finally {
      setLoading(false)
    }
  }

  async function toggleAi(song: Song) {
    const next = !song.is_ai
    setPending(song.id)
    try {
      const res = await fetch("/api/songs/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: song.id, is_ai: next }),
      })
      if (res.ok) {
        sileo.success({ title: next ? "Marcada como AI" : "Quitada marca AI" })
        fetchData()
      } else {
        sileo.error({ title: "Error al actualizar" })
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setPending(null)
    }
  }

  if (loading) {
    return (
      <p className="font-mono text-[0.65rem] text-[oklch(0.65_0_0)] italic">
        Cargando canciones...
      </p>
    )
  }

  if (songs.length === 0) {
    return (
      <p className="font-mono text-[0.65rem] text-[oklch(0.65_0_0)] italic">
        No hay canciones.
      </p>
    )
  }

  const aiSongs = songs.filter((s) => s.is_ai)
  const rest = songs.filter((s) => !s.is_ai)

  return (
    <>
      {/* AI-marked songs */}
      {aiSongs.length > 0 && (
        <div className="mb-6">
          {aiSongs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              pending={pending === song.id}
              onToggle={() => toggleAi(song)}
            />
          ))}
        </div>
      )}

      {/* Section label */}
      {rest.length > 0 && (
        <>
          <p className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-3">
            Marcar como AI
          </p>
          <div className="max-h-64 overflow-y-auto">
            {rest.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                pending={pending === song.id}
                onToggle={() => toggleAi(song)}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}

function SongRow({
  song,
  pending,
  onToggle,
}: {
  song: Song
  pending: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`flex items-center gap-4 py-3 border-b border-[oklch(0.93_0_0)] ${
        song.is_ai ? "bg-[oklch(0.975_0.005_25)]" : ""
      }`}
    >
      {song.album_image_url ? (
        <img
          src={song.album_image_url}
          alt={song.track_name}
          className="w-12 h-12 object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-[oklch(0.93_0_0)] shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[5px]">
          <p className="font-sans font-medium text-[0.85rem] text-foreground truncate">
            {song.track_name}
          </p>
          {song.is_ai && (
            <span className="shrink-0 flex items-center gap-[3px]">
              <svg
                className="w-[11px] h-[11px] text-[oklch(0.55_0.18_25)] fill-current shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18 2.5 2.5 0 0 0 10 15.5 2.5 2.5 0 0 0 7.5 13m9 0A2.5 2.5 0 0 0 14 15.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13z" />
              </svg>
              <span className="font-mono text-[0.55rem] font-bold tracking-[0.08em] text-[oklch(0.55_0.18_25)] uppercase">
                AI
              </span>
            </span>
          )}
        </div>
        <p className="font-mono text-[0.65rem] text-muted-foreground truncate">
          {song.artist_name}
        </p>
      </div>

      <button
        onClick={onToggle}
        disabled={pending}
        className={`shrink-0 font-mono text-[0.6rem] tracking-[0.1em] uppercase border px-[0.6rem] py-[0.3rem] transition-colors disabled:opacity-40 ${
          song.is_ai
            ? "border-[oklch(0.75_0.12_25)] text-[oklch(0.55_0.18_25)] hover:bg-[oklch(0.92_0.04_25)]"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
        }`}
      >
        {pending ? "..." : song.is_ai ? "Quitar" : "+ AI"}
      </button>
    </div>
  )
}
