import { createClient } from "@/lib/supabase/server"
import { TwitterEmbed } from "@/components/twitter-embed"
import { StarredSongOverlay } from "@/components/starred-song-overlay"
import { SongHistoryItem } from "@/components/song-history-item"
import { ActivityHeatmap } from "@/components/activity-heatmap"

interface Song {
  id: string
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_name: string | null
  album_image_url: string | null
  preview_url: string | null
  spotify_url: string
  added_at: string
}

interface SongWithCount {
  spotify_track_id: string
  track_name: string
  artist_name: string
  album_name: string | null
  album_image_url: string | null
  spotify_url: string
  latest_added_at: string
  play_count: number
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function getDaysSinceLastSong(lastDate: string): number {
  const last = new Date(lastDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - last.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function getAveragePerDay(songs: Song[]): string {
  if (!songs || songs.length === 0) return "0"
  const accurateStartDate = new Date("2025-12-18T00:00:00")
  const filteredSongs = songs.filter((song) => new Date(song.added_at) >= accurateStartDate)
  if (filteredSongs.length === 0) return "0"
  const firstDate = new Date(filteredSongs[filteredSongs.length - 1].added_at)
  const lastDate = new Date(filteredSongs[0].added_at)
  const diffDays = Math.max(1, Math.ceil(Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
  return (filteredSongs.length / diffDays).toFixed(1)
}

function getFirstSongDate(songs: Song[]): string {
  if (!songs || songs.length === 0) return ""
  const date = new Date(songs[songs.length - 1].added_at)
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function getHeroTimeLabel(dateString: string): { label: string; isToday: boolean } {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor(Math.abs(now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return { label: "Today", isToday: true }
  if (diffDays === 1) return { label: "Hace 1 día", isToday: false }
  return { label: `Hace ${diffDays} días`, isToday: false }
}

export default async function Home() {
  const supabase = await createClient()

  const { data: songs, error } = await supabase.from("songs").select("*").order("added_at", { ascending: false })
  const { data: starredSongs } = await supabase.from("starred_songs").select("*")

  if (error) {
    console.error("Error fetching songs:", error)
  }

  const starredMap: Record<
    string,
    {
      main_video_url: string | null
      link_1: string | null
      link_2: string | null
      link_3: string | null
      link_4: string | null
      link_5: string | null
    }
  > = {}
  if (starredSongs) {
    for (const s of starredSongs) {
      starredMap[s.spotify_track_id] = {
        main_video_url: s.main_video_url,
        link_1: s.link_1,
        link_2: s.link_2,
        link_3: s.link_3,
        link_4: s.link_4,
        link_5: s.link_5,
      }
    }
  }

  const songMap = new Map<string, SongWithCount>()
  if (songs) {
    songs.forEach((song: Song) => {
      const existing = songMap.get(song.spotify_track_id)
      if (existing) {
        existing.play_count += 1
        if (new Date(song.added_at) > new Date(existing.latest_added_at)) {
          existing.latest_added_at = song.added_at
        }
      } else {
        songMap.set(song.spotify_track_id, {
          spotify_track_id: song.spotify_track_id,
          track_name: song.track_name,
          artist_name: song.artist_name,
          album_name: song.album_name,
          album_image_url: song.album_image_url,
          spotify_url: song.spotify_url,
          latest_added_at: song.added_at,
          play_count: 1,
        })
      }
    })
  }

  const uniqueSongs = Array.from(songMap.values()).sort(
    (a, b) => new Date(b.latest_added_at).getTime() - new Date(a.latest_added_at).getTime(),
  )

  const latestSong = uniqueSongs[0]
  const daysSinceLastSong = latestSong ? getDaysSinceLastSong(latestSong.latest_added_at) : 0
  const averagePerDay = getAveragePerDay(songs || [])
  const latestIsNew = latestSong ? isToday(latestSong.latest_added_at) : false
  const firstSongDate = getFirstSongDate(songs || [])
  const heroTime = latestSong ? getHeroTimeLabel(latestSong.latest_added_at) : null
  const allSongDates = (songs || []).map((s: Song) => s.added_at)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="font-sans font-medium text-[clamp(2.2rem,6vw,3.2rem)] tracking-[-0.03em] leading-none text-foreground mb-2 text-balance">
            Matteo Ruggeri
          </h1>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-muted-foreground">
            Posting History
          </p>
        </header>

        {/* Hero — latest song */}
        {latestSong && (
          <section className="mb-16 text-center">
            <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Last posted
            </p>
            <p className="font-mono text-[0.575rem] tracking-[0.12em] uppercase text-[oklch(0.75_0_0)] mb-8">
              Impulsed by Opium
            </p>
            <a href={latestSong.spotify_url} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="flex flex-col items-center gap-6">
                {latestSong.album_image_url && (
                  <img
                    src={latestSong.album_image_url}
                    alt={latestSong.album_name || "Album"}
                    className="w-64 h-64 object-cover transition-opacity group-hover:opacity-[0.88]"
                  />
                )}
                <div>
                  <h2 className="font-sans font-medium text-[clamp(1.6rem,5vw,2.4rem)] tracking-[-0.025em] leading-[1.1] text-foreground mb-2 text-balance">
                    {latestSong.track_name}
                  </h2>
                  <p className="font-sans font-medium text-[1.15rem] text-muted-foreground mb-[0.4rem]">
                    {latestSong.artist_name}
                  </p>
                  {latestSong.album_name && (
                    <p className="font-sans text-[0.7rem] font-light italic text-[oklch(0.65_0_0)]">
                      {latestSong.album_name}
                    </p>
                  )}
                </div>
              </div>
            </a>
            {/* hero-time */}
            {heroTime && (
              <p
                className={`inline-block mt-[0.9rem] font-mono text-[0.6rem] tracking-[0.1em] uppercase ${
                  heroTime.isToday ? "text-[#4a90d9]" : "text-[oklch(0.72_0_0)]"
                }`}
              >
                {heroTime.label}
              </p>
            )}
          </section>
        )}

        {/* Divider */}
        <div className="border-t border-border mb-12" />

        {/* History by Day */}
        <section>
          <div className="flex items-baseline justify-between mb-8">
            <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground">History</p>
            <p className="font-mono text-[0.6rem] text-muted-foreground">
              {uniqueSongs.length} unique · {songs?.length || 0} total
            </p>
          </div>

          {!songs || songs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 italic font-mono text-sm">
              No songs yet. Add your first song at /add
            </p>
          ) : (
            <div className="space-y-8">
              {(() => {
                const songsByDay = new Map<string, Song[]>()
                songs.forEach((song: Song) => {
                  const dateKey = new Date(song.added_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  const existing = songsByDay.get(dateKey) || []
                  existing.push(song)
                  songsByDay.set(dateKey, existing)
                })

                return Array.from(songsByDay.entries()).map(([date, daySongs]) => {
                  const isDayToday = isToday(daySongs[0].added_at)
                  return (
                    <div key={date}>
                      <div className="flex items-center gap-[0.4rem] mb-3">
                        {isDayToday && (
                          <span className="w-[6px] h-[6px] bg-[#4a90d9] rounded-full shrink-0" />
                        )}
                        <p
                          className={`font-mono text-[0.55rem] tracking-[0.2em] uppercase ${
                            isDayToday ? "text-[oklch(0.6_0_0)]" : "text-[oklch(0.6_0_0)]"
                          } ${!isDayToday ? "ml-[14px]" : ""}`}
                        >
                          {date}
                        </p>
                        <span className="font-mono text-[0.55rem] text-[oklch(0.75_0_0)]">
                          {daySongs.length} {daySongs.length === 1 ? "song" : "songs"}
                        </span>
                      </div>
                      <div>
                        {daySongs.map((song: Song) => {
                          const playCount = songMap.get(song.spotify_track_id)?.play_count || 1
                          const isSongStarred = !!starredMap[song.spotify_track_id]
                          return (
                            <SongHistoryItem
                              key={song.id}
                              song={song}
                              playCount={playCount}
                              isStarred={isSongStarred}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="mt-12 pt-8 border-t border-[oklch(0.93_0_0)]">
          <div className="flex justify-center gap-12 text-center mb-2">
            <div>
              <p className="font-sans font-medium text-[1.6rem] tracking-[-0.03em] leading-none text-foreground mb-[0.35rem]">
                {averagePerDay}
              </p>
              <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[oklch(0.62_0_0)]">
                songs/day
              </p>
            </div>
            <div className="w-px bg-[oklch(0.88_0_0)]" />
            <div>
              <p
                className={`font-sans font-medium text-[1.6rem] tracking-[-0.03em] leading-none mb-[0.35rem] ${
                  daysSinceLastSong === 0 ? "text-[#4a90d9]" : "text-foreground"
                }`}
              >
                {daysSinceLastSong === 0 ? "Today" : daysSinceLastSong}
              </p>
              <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[oklch(0.62_0_0)]">
                {daysSinceLastSong === 0 ? "last post" : daysSinceLastSong === 1 ? "day ago" : "days ago"}
              </p>
            </div>
          </div>
          {firstSongDate && (
            <p className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[oklch(0.72_0_0)] mt-6 text-center">
              tracking since {firstSongDate}
            </p>
          )}
        </section>

        {/* Activity Heatmap — replaces "Top días" */}
        <ActivityHeatmap songDates={allSongDates} weeks={26} />

        {/* Twitter Embed */}
        <TwitterEmbed
          tweetHtml={`<blockquote class="twitter-tweet" data-media-max-width="560"><p lang="es" dir="ltr">El que no quiera, que no se lo crea. Cerrando el Opium el tío mientras los demás seguimos jodidos hoy. <a href="https://t.co/hFM3X34t2W">pic.twitter.com/hFM3X34t2W</a></p>&mdash; Camisetas Retro Atleti (@RetroAtleti) <a href="https://twitter.com/RetroAtleti/status/2016859862001410423?ref_src=twsrc%5Etfw">January 29, 2026</a></blockquote>`}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="font-mono text-[0.55rem] italic text-[oklch(0.72_0_0)] mb-6 leading-relaxed">
            * Tracking before 18/12/2025 may be inaccurate and is not included in average calculation
          </p>
          <img
            src="https://opiummadrid.com/wp-content/uploads/2023/10/Logo-Opium-Madrid-web-negro-banner-cookies.png"
            alt="Opium Madrid"
            className="h-8 mx-auto mb-4 opacity-55 grayscale"
          />
          <p className="font-mono text-[0.6rem] text-[oklch(0.72_0_0)] tracking-[0.05em]">
            Powered by Ivanmi &amp; Associates
          </p>
        </footer>
      </div>

      {/* Starred songs overlay */}
      <StarredSongOverlay starredMap={starredMap} />
    </main>
  )
}
