"use client"

import { useState, useEffect } from "react"
import { sileo } from "sileo"

interface Song {
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_image_url: string | null
}

interface StarredSong {
  id: string
  spotify_track_id: string
  main_video_url: string | null
  link_1: string | null
  link_2: string | null
  link_3: string | null
  link_4: string | null
  link_5: string | null
}

export function StarManager() {
  const [songs, setSongs] = useState<Song[]>([])
  const [starred, setStarred] = useState<StarredSong[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSong, setEditingSong] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [links, setLinks] = useState({
    main_video_url: "",
    link_1: "",
    link_2: "",
    link_3: "",
    link_4: "",
    link_5: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [songsRes, starredRes] = await Promise.all([
        fetch("/api/songs/list?all=true"),
        fetch("/api/songs/star"),
      ])
      const songsData = await songsRes.json()
      const starredData = await starredRes.json()

      const uniqueMap = new Map<string, Song>()
      for (const s of songsData) {
        if (!uniqueMap.has(s.spotify_track_id)) uniqueMap.set(s.spotify_track_id, s)
      }
      setSongs(Array.from(uniqueMap.values()))
      setStarred(starredData)
    } catch {
      sileo.error({ title: "Error cargando datos" })
    } finally {
      setLoading(false)
    }
  }

  function isStarred(trackId: string): StarredSong | undefined {
    return starred.find((s) => s.spotify_track_id === trackId)
  }

  function openEdit(trackId: string) {
    const existing = isStarred(trackId)
    setEditingSong(trackId)
    setLinks({
      main_video_url: existing?.main_video_url || "",
      link_1: existing?.link_1 || "",
      link_2: existing?.link_2 || "",
      link_3: existing?.link_3 || "",
      link_4: existing?.link_4 || "",
      link_5: existing?.link_5 || "",
    })
  }

  async function handleSave() {
    if (!editingSong) return
    setSaving(true)
    try {
      const res = await fetch("/api/songs/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotify_track_id: editingSong, ...links }),
      })
      if (res.ok) {
        sileo.success({ title: "Star guardado" })
        setEditingSong(null)
        fetchData()
      } else {
        sileo.error({ title: "Error guardando" })
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setSaving(false)
    }
  }

  async function handleUnstar(trackId: string) {
    try {
      const res = await fetch("/api/songs/star", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotify_track_id: trackId }),
      })
      if (res.ok) {
        sileo.success({ title: "Star eliminado" })
        setEditingSong(null)
        fetchData()
      }
    } catch {
      sileo.error({ title: "Error eliminando star" })
    }
  }

  if (loading) {
    return (
      <p className="font-mono text-[0.65rem] text-muted-foreground py-8 text-center">
        Cargando canciones...
      </p>
    )
  }

  const starredSongs = songs.filter((s) => isStarred(s.spotify_track_id))
  const unstarredSongs = songs.filter((s) => !isStarred(s.spotify_track_id))

  const linkClass =
    "w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.8rem]"
  const linkLabelClass =
    "block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.6rem]"

  return (
    <>
      {/* Edit Modal */}
      {editingSong && (
        <div className="fixed inset-0 bg-background/93 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-[28rem] border border-border bg-background p-8 my-8">
            {(() => {
              const song = songs.find((s) => s.spotify_track_id === editingSong)
              return song ? (
                <div className="flex items-center gap-4 mb-8">
                  {song.album_image_url && (
                    <img
                      src={song.album_image_url}
                      alt={song.track_name}
                      className="w-12 h-12 object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-sans font-medium text-[0.85rem] truncate">{song.track_name}</p>
                    <p className="font-mono text-[0.65rem] text-muted-foreground truncate">
                      {song.artist_name}
                    </p>
                  </div>
                </div>
              ) : null
            })()}

            <div className="space-y-5">
              {(["main_video_url", "link_1", "link_2", "link_3", "link_4", "link_5"] as const).map(
                (key, i) => (
                  <div key={key}>
                    <label className={linkLabelClass}>
                      {i === 0 ? "Video principal (embed)" : `Link ${i}`}
                    </label>
                    <input
                      type="text"
                      value={links[key]}
                      onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                      placeholder="https://files.catbox.moe/..."
                      className={linkClass}
                    />
                  </div>
                )
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingSong(null)}
                className="flex-1 py-[0.85rem] border border-border bg-transparent font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:bg-[oklch(0.96_0_0)] transition-colors"
              >
                Cancelar
              </button>
              {isStarred(editingSong) && (
                <button
                  onClick={() => handleUnstar(editingSong)}
                  className="py-[0.85rem] px-4 border border-[#e8c4bc] text-[#c0392b] bg-transparent font-mono text-[0.7rem] uppercase tracking-[0.1em] hover:bg-[#fdf0ee] transition-colors"
                >
                  Quitar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
              >
                {saving ? "Guardando..." : "Guardar star"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starred songs */}
      {starredSongs.length === 0 && unstarredSongs.length === 0 && (
        <p className="font-mono text-[0.65rem] italic text-muted-foreground py-12 text-center">
          No hay canciones
        </p>
      )}

      <div>
        {starredSongs.map((song) => (
          <div
            key={song.spotify_track_id}
            className="flex items-center gap-4 py-3 border-b border-[oklch(0.93_0_0)]"
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
              <p className="font-sans font-medium text-[0.85rem] text-foreground truncate">
                {song.track_name}
              </p>
              <p className="font-mono text-[0.65rem] text-muted-foreground truncate">
                {song.artist_name}
              </p>
            </div>
            <button
              onClick={() => openEdit(song.spotify_track_id)}
              className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[oklch(0.6_0.12_85)] border border-[oklch(0.85_0.06_85)] px-[0.6rem] py-[0.3rem] hover:bg-[oklch(0.97_0.01_85)] transition-colors shrink-0"
            >
              ✦ Editar
            </button>
          </div>
        ))}
      </div>

      {/* Add new star */}
      <div className="mt-6 pt-0">
        <p className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-3">
          Añadir star
        </p>
        <div className="max-h-64 overflow-y-auto">
          {unstarredSongs.map((song) => (
            <button
              key={song.spotify_track_id}
              onClick={() => openEdit(song.spotify_track_id)}
              className="w-full flex items-center gap-4 py-3 border-b border-[oklch(0.93_0_0)] hover:bg-[oklch(0.97_0_0)] transition-colors text-left"
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
                <p className="font-sans font-medium text-[0.85rem] text-foreground truncate">
                  {song.track_name}
                </p>
                <p className="font-mono text-[0.65rem] text-muted-foreground truncate">
                  {song.artist_name}
                </p>
              </div>
              <span className="font-mono text-[0.6rem] text-muted-foreground/40 shrink-0">+ star</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
