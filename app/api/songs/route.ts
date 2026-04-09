import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { trackData } = await request.json()

    if (!trackData) {
      return NextResponse.json({ error: "Datos de canción requeridos" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("songs")
      .insert({
        spotify_track_id: trackData.id,
        track_name: trackData.name,
        artist_name: trackData.artists.map((a: { name: string }) => a.name).join(", "),
        album_name: trackData.album.name,
        album_image_url: trackData.album.images[0]?.url || null,
        preview_url: trackData.preview_url || null,
        spotify_url: trackData.external_urls.spotify,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Error al guardar la canción" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in POST /api/songs:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
