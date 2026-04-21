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
      className={`group flex items-center gap-5 py-4 border-b border-[oklch(0.93_0_0)] transition-colors -mx-4 px-4 ${
        isStarred
          ? "bg-[oklch(0.99_0.008_85)] hover:bg-[oklch(0.97_0.012_85)]"
          : "hover:bg-[oklch(0.975_0_0)]"
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
            className="w-20 h-20 object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-medium text-[0.95rem] text-foreground truncate mb-[0.2rem]">
            {song.track_name}
          </h3>
          <p className="font-mono text-[0.7rem] text-muted-foreground truncate">{song.artist_name}</p>
        </div>
      </a>
      <div className="flex items-center gap-3 shrink-0">
        {playCount > 1 && (
          <span className="font-mono text-[0.7rem] text-[oklch(0.65_0_0)]">{playCount}x</span>
        )}
        {isStarred && (
          <button
            onClick={() => (window as any).__openStarPopup?.(song.spotify_track_id)}
            className="text-[oklch(0.75_0.12_85)] hover:text-[oklch(0.6_0.15_85)] transition-colors"
            aria-label="Ver canción destacada"
          >
            <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
