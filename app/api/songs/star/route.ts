import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("starred_songs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Fetch starred error:", error)
      return NextResponse.json({ error: "Failed to fetch starred songs" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Starred error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { spotify_track_id, main_video_url, link_1, link_2, link_3, link_4, link_5 } = body

    if (!spotify_track_id) {
      return NextResponse.json({ error: "Missing spotify_track_id" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already starred
    const { data: existing } = await supabase
      .from("starred_songs")
      .select("id")
      .eq("spotify_track_id", spotify_track_id)
      .single()

    if (existing) {
      // Update existing star
      const { error } = await supabase
        .from("starred_songs")
        .update({ main_video_url, link_1, link_2, link_3, link_4, link_5 })
        .eq("spotify_track_id", spotify_track_id)

      if (error) {
        return NextResponse.json({ error: "Failed to update star" }, { status: 500 })
      }
    } else {
      // Create new star
      const { error } = await supabase
        .from("starred_songs")
        .insert({ spotify_track_id, main_video_url, link_1, link_2, link_3, link_4, link_5 })

      if (error) {
        return NextResponse.json({ error: "Failed to star song" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Star error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { spotify_track_id } = await request.json()

    if (!spotify_track_id) {
      return NextResponse.json({ error: "Missing spotify_track_id" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("starred_songs")
      .delete()
      .eq("spotify_track_id", spotify_track_id)

    if (error) {
      return NextResponse.json({ error: "Failed to unstar song" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unstar error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
