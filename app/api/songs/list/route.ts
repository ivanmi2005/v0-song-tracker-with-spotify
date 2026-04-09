import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const manualOnly = searchParams.get("manual") === "true"

    const supabase = await createClient()

    let query = supabase.from("songs").select("*").order("added_at", { ascending: false })

    if (manualOnly) {
      query = query.like("spotify_track_id", "manual-%")
    } else if (searchParams.get("all") !== "true") {
      query = query.limit(50)
    }

    const { data: songs, error } = await query

    if (error) {
      return NextResponse.json({ error: "Error loading songs" }, { status: 500 })
    }

    return NextResponse.json(songs || [])
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
