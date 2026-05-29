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

// Using wolfXspotify API (free, no credentials required) with Spotify API as fallback
// https://github.com/WOLFTECH-254/wolfXspotify-API
const WOLF_API_BASE = "https://wolfxspotify.vercel.app/api"

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[]
  }
}

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

// Cache the access token (lasts ~3600s) for Spotify API fallback
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SPOTIFY_CLIENT_ID || "",
        client_secret: process.env.SPOTIFY_CLIENT_SECRET || "",
      }),
      cache: "no-store",
    })

    if (!res.ok) return null

    const data = await res.json()
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }
    return cachedToken.value
  } catch {
    return null
  }
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
  // Try wolfXspotify first
  try {
    const res = await fetch(`${WOLF_API_BASE}/track/${trackId}`, {
      cache: "no-store",
    })

    if (res.ok) {
      const data: WolfTrackResponse = await res.json()
      if (data.success && data.track) {
        return transformWolfTrackToSpotify(data.track)
      }
    }
  } catch (error) {
    console.error("[v0] wolfXspotify API error:", error)
  }

  // Fallback to official Spotify API
  try {
    const token = await getAccessToken()
    if (!token) return null

    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("[v0] Spotify API error:", error)
    return null
  }
}

export async function searchSpotifyTrack(query: string): Promise<SpotifyTrack | null> {
  // Try wolfXspotify first
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

    if (res.ok) {
      const data: WolfSearchResponse = await res.json()
      if (data.success && data.results?.length) {
        return transformWolfTrackToSpotify(data.results[0])
      }
    }
  } catch (error) {
    console.error("[v0] wolfXspotify search error:", error)
  }

  // Fallback to official Spotify API
  try {
    const token = await getAccessToken()
    if (!token) return null

    const res = await fetch(
      `https://api.spotify.com/v1/search?${new URLSearchParams({
        q: query,
        type: "track",
        limit: "1",
      })}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    )

    if (!res.ok) return null

    const data: SpotifySearchResult = await res.json()
    return data.tracks.items[0] || null
  } catch (error) {
    console.error("[v0] Spotify search error:", error)
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
