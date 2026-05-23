import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Defense-in-depth guard for route handlers. Returns a 401 response when the
// caller is not the owner, or null when access is granted.
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}
