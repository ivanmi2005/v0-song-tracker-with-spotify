import { createClient } from "@/lib/supabase/server"
import { MrwSite, type MrwGroup, type MrwSong, type MrwStats } from "@/components/mrw-site"

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
  is_ai?: boolean
}

const TWEET_HTML = `<blockquote class="twitter-tweet" data-media-max-width="560"><p lang="es" dir="ltr">El que no quiera, que no se lo crea. Cerrando el Opium el tío mientras los demás seguimos jodidos hoy. <a href="https://t.co/hFM3X34t2W">pic.twitter.com/hFM3X34t2W</a></p>&mdash; Camisetas Retro Atleti (@RetroAtleti) <a href="https://twitter.com/RetroAtleti/status/2016859862001410423?ref_src=twsrc%5Etfw">January 29, 2026</a></blockquote>`

function dateKey(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
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
  return dateKey(songs[songs.length - 1].added_at)
}

function getHeroTimeLabel(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor(Math.abs(now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Hace 1 día"
  return `Hace ${diffDays} días`
}

export default async function Home() {
  const supabase = await createClient()

  const { data: songs, error } = await supabase
    .from("songs")
    .select("*")
    .order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching songs:", error)
  }

  const allSongs: Song[] = songs || []

  // Reshape into the design's day-grouped structure: dedup tracks within a day,
  // plays = times that track was posted that day. Songs come newest-first.
  const groupsMap = new Map<string, Map<string, MrwSong>>()
  for (const song of allSongs) {
    const key = dateKey(song.added_at)
    let tracks = groupsMap.get(key)
    if (!tracks) {
      tracks = new Map<string, MrwSong>()
      groupsMap.set(key, tracks)
    }
    const existing = tracks.get(song.spotify_track_id)
    if (existing) {
      existing.plays += 1
    } else {
      tracks.set(song.spotify_track_id, {
        title: song.track_name,
        artist: song.artist_name,
        plays: 1,
        cover: song.album_image_url,
        spotify: song.spotify_url,
      })
    }
  }

  const groups: MrwGroup[] = Array.from(groupsMap.entries()).map(([date, tracks]) => ({
    date,
    count: tracks.size,
    songs: Array.from(tracks.values()),
  }))

  // Top artists weighted by postings (split comma-separated artist strings).
  const artistCounts = new Map<string, number>()
  for (const song of allSongs) {
    for (const part of song.artist_name.split(",")) {
      const name = part.trim()
      if (!name) continue
      artistCounts.set(name, (artistCounts.get(name) || 0) + 1)
    }
  }
  const topArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Top songs weighted by number of postings (play count per track).
  const songCounts = new Map<string, { title: string; artist: string; count: number }>()
  for (const song of allSongs) {
    const existing = songCounts.get(song.spotify_track_id)
    if (existing) {
      existing.count += 1
    } else {
      songCounts.set(song.spotify_track_id, { title: song.track_name, artist: song.artist_name, count: 1 })
    }
  }
  const topSongs = Array.from(songCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const heaviestDay = groups.reduce<{ date: string; count: number } | null>((max, g) => {
    if (!max || g.songs.length > max.count) return { date: g.date, count: g.songs.length }
    return max
  }, null)

  const latest = allSongs[0]

  const stats: MrwStats = {
    totalSongs: allSongs.length,
    uniqueCount: new Set(allSongs.map((s) => s.spotify_track_id)).size,
    daysTracked: groups.length,
    totalPlays: allSongs.length,
    avgPerDay: getAveragePerDay(allSongs),
    heaviestDay,
    lastPosted: latest ? { title: latest.track_name, artist: latest.artist_name } : null,
    topArtists,
    topSongs,
    heroTimeLabel: latest ? getHeroTimeLabel(latest.added_at) : "",
    firstSongDate: getFirstSongDate(allSongs),
  }

  return <MrwSite groups={groups} stats={stats} tweetHtml={TWEET_HTML} />
}
