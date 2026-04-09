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

      // Get unique songs
      const uniqueMap = new Map<string, Song>()
      for (const s of songsData) {
        if (!uniqueMap.has(s.spotify_track_id)) {
          uniqueMap.set(s.spotify_track_id, s)
        }
      }
      setSongs(Array.from(uniqueMap.values()))
      setStarred(starredData)
    } catch {
      sileo.error({ title: "Error loading data" })
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
        body: JSON.stringify({
          spotify_track_id: editingSong,
          ...links,
        }),
      })

      if (res.ok) {
        sileo.success({ title: "Star saved" })
        setEditingSong(null)
        fetchData()
      } else {
        sileo.error({ title: "Error saving" })
      }
    } catch {
      sileo.error({ title: "Connection error" })
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
        sileo.success({ title: "Star removed" })
        setEditingSong(null)
        fetchData()
      }
    } catch {
      sileo.error({ title: "Error removing star" })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Loading songs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Edit Modal */}
      {editingSong && (
        <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-border bg-background p-8">
            {(() => {
              const song = songs.find((s) => s.spotify_track_id === editingSong)
              return song ? (
                <div className="flex items-center gap-4 mb-8">
                  {song.album_image_url && (
                    <img
                      src={song.album_image_url || "/placeholder.svg"}
                      alt={song.track_name}
                      className="w-14 h-14 object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-normal truncate">{song.track_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
                  </div>
                </div>
              ) : null
            })()}

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                  Main Video URL (embed)
                </label>
                <input
                  type="text"
                  value={links.main_video_url}
                  onChange={(e) => setLinks({ ...links, main_video_url: e.target.value })}
                  placeholder="https://files.catbox.moe/..."
                  className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                  Link 1
                </label>
                <input
                  type="text"
                  value={links.link_1}
                  onChange={(e) => setLinks({ ...links, link_1: e.target.value })}
                  placeholder="https://files.catbox.moe/..."
                  className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                  Link 2
                </label>
                <input
                  type="text"
                  value={links.link_2}
                  onChange={(e) => setLinks({ ...links, link_2: e.target.value })}
                  placeholder="https://files.catbox.moe/..."
                  className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                  Link 3
                </label>
                <input
                  type="text"
                  value={links.link_3}
                  onChange={(e) => setLinks({ ...links, link_3: e.target.value })}
                  placeholder="https://files.catbox.moe/..."
                  className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                  Link 4
                </label>
                <input
                  type="text"
                  value={links.link_4}
                  onChange={(e) => setLinks({ ...links, link_4: e.target.value })}
                  placeholder="https://files.catbox.moe/..."
                  className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                  Link 5
                </label>
                <input
                  type="text"
                  value={links.link_5}
                  onChange={(e) => setLinks({ ...links, link_5: e.target.value })}
                  placeholder="https://files.catbox.moe/..."
                  className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingSong(null)}
                className="flex-1 py-3 border border-border bg-transparent font-mono text-xs uppercase tracking-widest hover:bg-secondary/30 transition-colors"
              >
                Cancel
              </button>
              {isStarred(editingSong) && (
                <button
                  onClick={() => handleUnstar(editingSong)}
                  className="py-3 px-4 border border-red-300 text-red-500 bg-transparent font-mono text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  Unstar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Star"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song list */}
      {songs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 italic">No songs yet</p>
      ) : (
        songs.map((song) => {
          const starData = isStarred(song.spotify_track_id)
          return (
            <button
              key={song.spotify_track_id}
              onClick={() => openEdit(song.spotify_track_id)}
              className={`w-full flex items-center gap-4 py-4 border-b border-border/30 hover:bg-secondary/30 transition-colors -mx-4 px-4 text-left ${
                starData ? "bg-amber-50/50" : ""
              }`}
            >
              {song.album_image_url && (
                <img
                  src={song.album_image_url || "/placeholder.svg"}
                  alt={song.track_name}
                  className="w-14 h-14 object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-normal text-foreground truncate">{song.track_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
              </div>
              {starData ? (
                <svg
                  className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-muted-foreground/30 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}
