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

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[]
  }
}

// Cache the access token (lasts ~3600s)
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

    if (!res.ok) {
      console.error("[v0] Failed to get Spotify token:", await res.text())
      return null
    }

    const data = await res.json()
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }
    return cachedToken.value
  } catch (error) {
    console.error("[v0] Error getting Spotify token:", error)
    return null
  }
}

export async function getSpotifyTrack(trackId: string): Promise<SpotifyTrack | null> {
  try {
    const token = await getAccessToken()
    if (!token) {
      console.error("[v0] No Spotify token available. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET")
      return null
    }

    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("[v0] Spotify track fetch failed:", res.status, await res.text())
      return null
    }
    return await res.json()
  } catch (error) {
    console.error("[v0] Spotify API error:", error)
    return null
  }
}

export async function searchSpotifyTrack(query: string): Promise<SpotifyTrack | null> {
  try {
    const token = await getAccessToken()
    if (!token) {
      console.error("[v0] No Spotify token available. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET")
      return null
    }

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

    if (!res.ok) {
      console.error("[v0] Spotify search failed:", res.status, await res.text())
      return null
    }

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
