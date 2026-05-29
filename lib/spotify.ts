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

// Get Spotify access token without credentials using web access
async function getWebAccessToken(): Promise<string | null> {
  try {
    // Fetch Spotify main page to get access token from HTML
    const res = await fetch("https://open.spotify.com", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    const html = await res.text()
    
    // Extract accessToken from the HTML response
    const accessTokenMatch = html.match(/"accessToken":"([^"]+)"/)
    if (accessTokenMatch && accessTokenMatch[1]) {
      return accessTokenMatch[1]
    }
  } catch (error) {
    console.error("[v0] Error getting web access token:", error)
  }

  return null
}

// Cache token with expiry
let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  // Try getting token from env vars first if available
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
        cache: "no-store",
      })

      if (res.ok) {
        const data = await res.json()
        return data.access_token
      }
    } catch (error) {
      console.error("[v0] Error with credentials:", error)
    }
  }

  // Fallback to web access token
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const token = await getWebAccessToken()
  if (token) {
    tokenCache = {
      token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    }
    return token
  }

  return null
}

export async function getSpotifyTrack(trackId: string): Promise<SpotifyTrack | null> {
  try {
    const token = await getAccessToken()
    if (!token) {
      console.error("[v0] Unable to get Spotify token")
      return null
    }

    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("[v0] Spotify track fetch failed:", res.status)
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
      console.error("[v0] Unable to get Spotify token")
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
      console.error("[v0] Spotify search failed:", res.status)
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
