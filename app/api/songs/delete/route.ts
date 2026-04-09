import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Song ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("songs")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Error deleting song" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in POST /api/songs/delete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
