"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"

interface Song {
  id: string
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_image_url: string | null
  is_ai: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AiManager() {
  const { data: songs, isLoading } = useSWR<Song[]>("/api/songs/list?all=true", fetcher)
  const [pending, setPending] = useState<Record<string, boolean>>({})

  async function toggleAi(song: Song) {
    const next = !song.is_ai
    setPending((p) => ({ ...p, [song.id]: true }))
    await fetch("/api/songs/ai", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: song.id, is_ai: next }),
    })
    await mutate("/api/songs/list?all=true")
    setPending((p) => {
      const copy = { ...p }
      delete copy[song.id]
      return copy
    })
  }

  if (isLoading) {
    return (
      <p className="font-mono text-[0.65rem] text-[oklch(0.65_0_0)] italic">Cargando canciones...</p>
    )
  }

  if (!songs || songs.length === 0) {
    return (
      <p className="font-mono text-[0.65rem] text-[oklch(0.65_0_0)] italic">No hay canciones.</p>
    )
  }

  // Separate AI songs first, then rest
  const sorted = [...songs].sort((a, b) => Number(b.is_ai) - Number(a.is_ai))

  return (
    <div className="space-y-[2px]">
      {sorted.map((song) => (
        <div
          key={song.id}
          className={`flex items-center gap-3 py-3 px-3 border border-transparent transition-colors ${
            song.is_ai
              ? "bg-[oklch(0.97_0.01_25)] border-[oklch(0.92_0.04_25)]"
              : "hover:bg-[oklch(0.975_0_0)]"
          }`}
        >
          {/* Cover */}
          <div className="w-9 h-9 shrink-0 bg-[oklch(0.93_0_0)] overflow-hidden">
            {song.album_image_url && (
              <img
                src={song.album_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[5px]">
              <p className="font-sans font-medium text-[0.8rem] text-foreground truncate">
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
            <p className="font-mono text-[0.62rem] text-[oklch(0.65_0_0)] truncate">
              {song.artist_name}
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={() => toggleAi(song)}
            disabled={pending[song.id]}
            className={`shrink-0 font-mono text-[0.58rem] tracking-[0.1em] uppercase px-2 py-1 border transition-colors ${
              song.is_ai
                ? "border-[oklch(0.75_0.12_25)] text-[oklch(0.55_0.18_25)] hover:bg-[oklch(0.92_0.04_25)]"
                : "border-border text-[oklch(0.65_0_0)] hover:text-foreground hover:border-foreground"
            } disabled:opacity-40`}
          >
            {pending[song.id] ? "..." : song.is_ai ? "Quitar AI" : "Marcar AI"}
          </button>
        </div>
      ))}
    </div>
  )
}
