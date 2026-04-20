"use client"

import { useState, useEffect } from "react"
import { sileo } from "sileo"

interface Song {
  id: string
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_name: string
  album_image_url: string | null
  added_at: string
}

export function DeleteSongList() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSongs()
  }, [])

  async function fetchSongs() {
    try {
      const response = await fetch("/api/songs/list")
      const data = await response.json()
      if (Array.isArray(data)) setSongs(data)
    } catch {
      sileo.error({ title: "Error cargando canciones" })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedSong) return
    setDeleting(true)
    try {
      const response = await fetch("/api/songs/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSong.id }),
      })
      const data = await response.json()
      if (response.ok) {
        sileo.success({ title: "Canción eliminada" })
        setSongs(songs.filter((s) => s.id !== selectedSong.id))
        setSelectedSong(null)
      } else {
        sileo.error({ title: data.error || "Error al eliminar" })
      }
    } catch {
      sileo.error({ title: "Error al eliminar" })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <p className="font-mono text-[0.65rem] text-muted-foreground py-8 text-center">
        Cargando canciones...
      </p>
    )
  }

  if (songs.length === 0) {
    return (
      <p className="font-mono text-[0.65rem] italic text-muted-foreground py-12 text-center">
        No hay canciones en el historial
      </p>
    )
  }

  return (
    <>
      {/* Confirmation overlay */}
      {selectedSong && (
        <div className="fixed inset-0 bg-background/93 flex items-center justify-center z-50 p-6">
          <div className="bg-background border border-border p-8 max-w-[22rem] w-full">
            <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Confirmar eliminación
            </p>
            <div className="flex items-center gap-4 mb-6">
              {selectedSong.album_image_url && (
                <img
                  src={selectedSong.album_image_url}
                  alt={selectedSong.album_name}
                  className="w-12 h-12 object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-[0.85rem] text-foreground truncate">
                  {selectedSong.track_name}
                </p>
                <p className="font-mono text-[0.65rem] text-muted-foreground truncate">
                  {selectedSong.artist_name} ·{" "}
                  {new Date(selectedSong.added_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className="font-mono text-[0.65rem] text-muted-foreground mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSong(null)}
                disabled={deleting}
                className="flex-1 py-[0.85rem] border border-border bg-transparent text-foreground font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:bg-[oklch(0.96_0_0)] disabled:opacity-40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 transition-opacity"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song list */}
      <div>
        {songs.map((song) => (
          <div
            key={song.id}
            className="flex items-center gap-4 py-3 border-b border-[oklch(0.93_0_0)]"
          >
            {song.album_image_url ? (
              <img
                src={song.album_image_url}
                alt={song.album_name}
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
                {song.artist_name} ·{" "}
                {new Date(song.added_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => setSelectedSong(song)}
              className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#c0392b] border border-[#e8c4bc] px-[0.6rem] py-[0.3rem] hover:bg-[#fdf0ee] transition-colors shrink-0"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
