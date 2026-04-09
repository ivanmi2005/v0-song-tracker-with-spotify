import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { manualSongId, spotifyTrackId, spotifyData } = await request.json()

    if (!manualSongId || !spotifyTrackId || !spotifyData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update the manual song with Spotify data
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
      console.error("[v0] Sync error:", error)
      return NextResponse.json({ error: "Failed to sync song" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
