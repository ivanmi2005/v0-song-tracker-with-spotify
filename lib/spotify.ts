// Spotify API utilities
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

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[]
  }
}

export async function getSpotifyTrack(trackId: string): Promise<SpotifyTrack | null> {
  try {
    // Get access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SPOTIFY_CLIENT_ID || "",
        client_secret: process.env.SPOTIFY_CLIENT_SECRET || "",
      }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) {
      console.error("[v0] Failed to get Spotify token:", tokenResponse.statusText)
      return null
    }

    const { access_token } = await tokenResponse.json()

    // Get track info
    const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: "no-store",
    })

    if (!trackResponse.ok) {
      console.error("[v0] Failed to get track:", trackResponse.statusText)
      return null
    }

    return await trackResponse.json()
  } catch (error) {
    console.error("[v0] Error fetching Spotify track:", error)
    return null
  }
}

export async function searchSpotifyTrack(query: string): Promise<SpotifyTrack | null> {
  try {
    // Get access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SPOTIFY_CLIENT_ID || "",
        client_secret: process.env.SPOTIFY_CLIENT_SECRET || "",
      }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) {
      console.error("[v0] Failed to get Spotify token:", tokenResponse.statusText)
      return null
    }

    const { access_token } = await tokenResponse.json()

    // Search for track
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?${new URLSearchParams({
        q: query,
        type: "track",
        limit: "1",
      })}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        cache: "no-store",
      },
    )

    if (!searchResponse.ok) {
      console.error("[v0] Failed to search track:", searchResponse.statusText)
      return null
    }

    const data: SpotifySearchResult = await searchResponse.json()

    // Return the first result
    return data.tracks.items[0] || null
  } catch (error) {
    console.error("[v0] Error searching Spotify track:", error)
    return null
  }
}

export function extractTrackIdFromUrl(url: string): string | null {
  try {
    // Handle spotify:track:xxx format
    if (url.startsWith("spotify:track:")) {
      return url.split(":")[2]
    }

    // Handle https://open.spotify.com/track/xxx format
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const trackIndex = pathParts.indexOf("track")

    if (trackIndex !== -1 && pathParts[trackIndex + 1]) {
      // Remove query parameters if any
      return pathParts[trackIndex + 1].split("?")[0]
    }

    return null
  } catch {
    return null
  }
}
