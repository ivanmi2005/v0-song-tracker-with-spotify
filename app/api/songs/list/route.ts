import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: songs, error } = await supabase
      .from("songs")
      .select("*")
      .order("added_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Error loading songs" }, { status: 500 })
    }

    return NextResponse.json(songs || [])
  } catch (error) {
    console.error("[v0] Error in GET /api/songs/list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
