import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSpotifyTrack } from "@/lib/spotify"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trackId, customDate, manual, trackName, artistName, albumName } = body

    if (!customDate) {
      return NextResponse.json({ error: "Missing customDate" }, { status: 400 })
    }

    const supabase = await createClient()

    let songData: Record<string, unknown>

    if (manual) {
      if (!trackName || !artistName) {
        return NextResponse.json({ error: "Missing song or artist name" }, { status: 400 })
      }

      const manualId = `manual-${Date.now()}`
      songData = {
        spotify_track_id: manualId,
        track_name: trackName,
        artist_name: artistName,
        album_name: albumName || null,
        album_image_url: null,
        preview_url: null,
        spotify_url: `#manual-entry:${manualId}`,
        added_at: customDate,
      }
    } else {
      if (!trackId) {
        return NextResponse.json({ error: "Missing trackId" }, { status: 400 })
      }

      const trackData = await getSpotifyTrack(trackId)

      if (!trackData) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 })
      }

      songData = {
        spotify_track_id: trackData.id,
        track_name: trackData.name,
        artist_name: trackData.artists.map((a: { name: string }) => a.name).join(", "),
        album_name: trackData.album?.name || null,
        album_image_url: trackData.album?.images?.[0]?.url || null,
        preview_url: trackData.preview_url || null,
        spotify_url: trackData.external_urls?.spotify || `https://open.spotify.com/track/${trackData.id}`,
        added_at: customDate,
      }
    }

    const { error } = await supabase.from("songs").insert(songData)

    if (error) {
      return NextResponse.json({ error: "Failed to save song" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
