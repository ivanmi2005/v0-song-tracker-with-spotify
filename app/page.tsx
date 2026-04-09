import { createClient } from "@/lib/supabase/server"
import { TwitterEmbed } from "@/components/twitter-embed"
import { StarredSongOverlay } from "@/components/starred-song-overlay"
import { SongHistoryItem } from "@/components/song-history-item"

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

function getTopDays(songs: Song[]): { date: string; count: number }[] {
  const dayMap = new Map<string, number>()
  songs.forEach((song) => {
    const dateKey = new Date(song.added_at).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1)
  })
  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export default async function Home() {
  const supabase = await createClient()

  const { data: songs, error } = await supabase.from("songs").select("*").order("added_at", { ascending: false })
  const { data: starredSongs } = await supabase.from("starred_songs").select("*")

  if (error) {
    console.error("Error fetching songs:", error)
  }

  const starredMap: Record<string, { main_video_url: string | null; link_1: string | null; link_2: string | null; link_3: string | null; link_4: string | null; link_5: string | null }> = {}
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
  const topDays = getTopDays(songs || [])

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-2">{"Matteo Ruggeri"}</h1>
          <p className="text-muted-foreground font-mono text-sm tracking-wide uppercase">Posting History</p>
        </header>

        {/* Latest Song */}
        {latestSong && (
          <section className="mb-16 text-center">
            <div className="relative inline-block">
              <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-2">Last posted</p>
              <p className="text-[10px] font-mono tracking-wide uppercase text-muted-foreground/40 mb-8">Impulsed by Opium</p>
            </div>
            <a href={latestSong.spotify_url} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="flex flex-col items-center gap-6">
                {latestSong.album_image_url && (
                  <img
                    src={latestSong.album_image_url}
                    alt={latestSong.album_name || "Album"}
                    className="w-64 h-64 object-cover shadow-lg"
                  />
                )}
                <div>
                  <h2 className="text-3xl md:text-4xl font-light text-foreground mb-2 text-balance">
                    {latestSong.track_name}
                  </h2>
                  <p className="text-xl text-muted-foreground">{latestSong.artist_name}</p>
                  {latestSong.album_name && (
                    <p className="text-muted-foreground/70 mt-2 italic font-mono font-extralight text-sm">
                      {latestSong.album_name}
                    </p>
                  )}
                </div>
              </div>
            </a>
          </section>
        )}

        {/* Divider */}
        <div className="border-t border-border mb-12" />

        {/* History by Day */}
        <section>
          <div className="flex items-baseline justify-between mb-8">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">History</p>
            <p className="text-xs font-mono text-muted-foreground">
              {uniqueSongs.length} unique · {songs?.length || 0} total
            </p>
          </div>

          {!songs || songs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 italic">No songs yet. Add your first song at /add</p>
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
                      <div className="flex items-center gap-2 mb-3">
                        {isDayToday && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                        <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/60">
                          {date}
                        </p>
                        <span className="text-[9px] font-mono text-muted-foreground/40">
                          {daySongs.length} {daySongs.length === 1 ? "song" : "songs"}
                        </span>
                      </div>
                      <div className="space-y-0">
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
        <section className="mt-12 pt-8 border-t border-border/30">
          <div className="flex justify-center gap-12 text-center">
            <div>
              <p className="text-2xl font-light text-foreground">{averagePerDay}</p>
              <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wide mt-1">songs/day</p>
            </div>
            <div className="w-px bg-border/50" />
            <div>
              <p className="text-2xl font-light text-foreground">
                {daysSinceLastSong === 0 ? <span className="text-blue-500">Today</span> : daysSinceLastSong}
              </p>
              <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wide mt-1">
                {daysSinceLastSong === 0 ? "last post" : daysSinceLastSong === 1 ? "day ago" : "days ago"}
              </p>
            </div>
          </div>
          {firstSongDate && (
            <p className="text-xs font-mono text-muted-foreground/40 uppercase tracking-wide mt-6 text-center">
              tracking since {firstSongDate}
            </p>
          )}
        </section>

        {/* Top días */}
        {topDays.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border/30">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground/60 mb-4 text-center">
              Top días
            </p>
            <div className="space-y-2">
              {topDays.map(({ date, count }, i) => (
                <div key={date} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground/30 w-4">{i + 1}</span>
                    <span className="text-xs font-mono text-muted-foreground">{date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1 bg-foreground/20 rounded-full"
                      style={{ width: `${Math.round((count / topDays[0].count) * 80)}px` }}
                    />
                    <span className="text-xs font-mono text-muted-foreground/60 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Twitter Embed */}
        <TwitterEmbed
          tweetHtml={`<blockquote class="twitter-tweet" data-media-max-width="560"><p lang="es" dir="ltr">El que no quiera, que no se lo crea. Cerrando el Opium el tío mientras los demás seguimos jodidos hoy. <a href="https://t.co/hFM3X34t2W">pic.twitter.com/hFM3X34t2W</a></p>&mdash; Camisetas Retro Atleti (@RetroAtleti) <a href="https://twitter.com/RetroAtleti/status/2016859862001410423?ref_src=twsrc%5Etfw">January 29, 2026</a></blockquote>`}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-[10px] font-mono text-muted-foreground/40 italic mb-6">
            * Tracking before 18/12/2025 may be inaccurate and is not included in average calculation
          </p>
          <img
            src="https://opiummadrid.com/wp-content/uploads/2023/10/Logo-Opium-Madrid-web-negro-banner-cookies.png"
            alt="Opium Madrid"
            className="h-8 mx-auto mb-4 opacity-60"
          />
          <p className="text-xs font-mono text-muted-foreground/50 tracking-wide">Powered by Ivanmi &amp; Associates</p>
        </footer>
      </div>

      {/* Starred songs overlay */}
      <StarredSongOverlay starredMap={starredMap} />
    </main>
  )
}
