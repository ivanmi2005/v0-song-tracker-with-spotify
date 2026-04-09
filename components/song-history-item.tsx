"use client"

interface SongHistoryItemProps {
  song: {
    id: string
    spotify_track_id: string
    track_name: string
    artist_name: string
    album_name: string | null
    album_image_url: string | null
    spotify_url: string
  }
  playCount: number
  isStarred: boolean
}

export function SongHistoryItem({ song, playCount, isStarred }: SongHistoryItemProps) {
  return (
    <div
      className={`group flex items-center gap-5 py-4 border-b border-border/30 transition-colors -mx-4 px-4 ${
        isStarred ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-secondary/30"
      }`}
    >
      <a
        href={song.spotify_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-5 flex-1 min-w-0"
      >
        {song.album_image_url && (
          <img
            src={song.album_image_url || "/placeholder.svg"}
            alt={song.album_name || "Album"}
            className="w-20 h-20 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-normal text-foreground truncate text-base">{song.track_name}</h3>
          <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
        </div>
      </a>
      <div className="flex items-center gap-3 shrink-0">
        {playCount > 1 && (
          <span className="font-mono text-sm text-muted-foreground/70">{playCount}x</span>
        )}
        {isStarred && (
          <button
            onClick={() => (window as any).__openStarPopup?.(song.spotify_track_id)}
            className="text-amber-400 hover:text-amber-500 transition-colors"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
