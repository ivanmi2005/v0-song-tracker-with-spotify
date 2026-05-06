import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
  try {
    const { id, is_ai } = await request.json()
    if (!id || typeof is_ai !== "boolean") {
      return NextResponse.json({ error: "Missing id or is_ai" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from("songs").update({ is_ai }).eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
