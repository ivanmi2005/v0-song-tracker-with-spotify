"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
      if (Array.isArray(data)) {
        setSongs(data)
      }
    } catch {
      sileo.error({ title: "Error loading songs" })
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
        sileo.success({ title: "Song deleted" })
        setSongs(songs.filter((s) => s.id !== selectedSong.id))
        setSelectedSong(null)
      } else {
        sileo.error({ title: data.error || "Error deleting song" })
      }
    } catch {
      sileo.error({ title: "Error deleting song" })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading songs...</p>
      </div>
    )
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground italic">No songs in history</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {selectedSong && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border p-6 max-w-sm w-full">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">
              Confirm deletion
            </p>
            <div className="flex items-center gap-4 mb-6">
              {selectedSong.album_image_url && (
                <img
                  src={selectedSong.album_image_url || "/placeholder.svg"}
                  alt={selectedSong.album_name}
                  className="w-16 h-16 object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-normal text-foreground truncate">{selectedSong.track_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{selectedSong.artist_name}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {new Date(selectedSong.added_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setSelectedSong(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-0">
        <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">
          Recent songs
        </p>
        {songs.map((song) => (
          <button
            key={song.id}
            type="button"
            onClick={() => setSelectedSong(song)}
            className="w-full flex items-center gap-4 py-4 border-b border-border/30 hover:bg-secondary/30 transition-colors -mx-4 px-4 text-left"
          >
            {song.album_image_url && (
              <img
                src={song.album_image_url || "/placeholder.svg"}
                alt={song.album_name}
                className="w-14 h-14 object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-normal text-foreground truncate">{song.track_name}</h3>
              <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground/60">
                {new Date(song.added_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
