import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { manualSongId, spotifyTrackId, spotifyData, coverOnly, coverUrl, externalUrl } = body

    if (!manualSongId) {
      return NextResponse.json({ error: "Missing manualSongId" }, { status: 400 })
    }

    const supabase = await createClient()

    // coverOnly mode: just update the cover image and external URL, keep spotify_track_id as-is
    if (coverOnly) {
      if (!coverUrl) {
        return NextResponse.json({ error: "Missing coverUrl for coverOnly sync" }, { status: 400 })
      }

      const { error } = await supabase
        .from("songs")
        .update({
          album_image_url: coverUrl,
          ...(externalUrl ? { spotify_url: externalUrl } : {}),
        })
        .eq("id", manualSongId)

      if (error) {
        return NextResponse.json({ error: "Failed to update cover" }, { status: 500 })
      }

      return NextResponse.json({ success: true, mode: "coverOnly" })
    }

    // Standard Spotify sync mode
    if (!spotifyTrackId || !spotifyData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase
      .from("songs")
      .update({
        spotify_track_id: spotifyTrackId,
        track_name: spotifyData.track_name,
        artist_name: spotifyData.artist_name,
        album_name: spotifyData.album_name,
        album_image_url: spotifyData.album_image_url,
        preview_url: spotifyData.preview_url,
        spotify_url: spotifyData.spotify_url,
      })
      .eq("id", manualSongId)

    if (error) {
      return NextResponse.json({ error: "Failed to sync song" }, { status: 500 })
    }

    return NextResponse.json({ success: true, mode: "spotify" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
