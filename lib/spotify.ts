export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string; height: number; width: number }[]
  }
  preview_url: string | null
  external_urls: {
    spotify: string
  }
}

// Using wolfXspotify API (free, no credentials required)
// https://github.com/WOLFTECH-254/wolfXspotify-API
const WOLF_API_BASE = "https://wolfxspotify.vercel.app/api"

interface WolfTrackResponse {
  success: boolean
  track: {
    id: string
    name: string
    artists: string[]
    album: string
    thumbnail: string
    duration_ms: number
    release_date: string
    explicit: boolean
    preview_url: string | null
    external_url: string
  }
}

interface WolfSearchResponse {
  success: boolean
  results: {
    id: string
    name: string
    artists: string[]
    album: string
    thumbnail: string
    duration_ms: number
    explicit: boolean
    preview_url: string | null
    external_url: string
  }[]
}

function transformWolfTrackToSpotify(wolfTrack: WolfTrackResponse["track"] | WolfSearchResponse["results"][0]): SpotifyTrack {
  return {
    id: wolfTrack.id,
    name: wolfTrack.name,
    artists: wolfTrack.artists.map(name => ({ name })),
    album: {
      name: wolfTrack.album,
      images: wolfTrack.thumbnail ? [{ url: wolfTrack.thumbnail, height: 300, width: 300 }] : [],
    },
    preview_url: wolfTrack.preview_url,
    external_urls: {
      spotify: wolfTrack.external_url || `https://open.spotify.com/track/${wolfTrack.id}`,
    },
  }
}

export async function getSpotifyTrack(trackId: string): Promise<SpotifyTrack | null> {
  try {
    const res = await fetch(`${WOLF_API_BASE}/track/${trackId}`, {
      cache: "no-store",
    })

    if (!res.ok) return null

    const data: WolfTrackResponse = await res.json()
    if (!data.success || !data.track) return null

    return transformWolfTrackToSpotify(data.track)
  } catch {
    return null
  }
}

export async function searchSpotifyTrack(query: string): Promise<SpotifyTrack | null> {
  try {
    const res = await fetch(
      `${WOLF_API_BASE}/search?${new URLSearchParams({
        q: query,
        type: "track",
        limit: "1",
      })}`,
      {
        cache: "no-store",
      },
    )

    if (!res.ok) return null

    const data: WolfSearchResponse = await res.json()
    if (!data.success || !data.results?.length) return null

    return transformWolfTrackToSpotify(data.results[0])
  } catch {
    return null
  }
}

export function extractTrackIdFromUrl(url: string): string | null {
  try {
    if (url.startsWith("spotify:track:")) {
      return url.split(":")[2]
    }

    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const trackIndex = pathParts.indexOf("track")

    if (trackIndex !== -1 && pathParts[trackIndex + 1]) {
      return pathParts[trackIndex + 1]
    }

    return null
  } catch {
    return null
  }
}
