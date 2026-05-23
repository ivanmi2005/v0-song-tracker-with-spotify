import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Read-only endpoints that stay public regardless of auth.
const PUBLIC_API: { path: string; method: string }[] = [
  { path: "/api/songs/list", method: "GET" },
  { path: "/api/songs/star", method: "GET" },
  { path: "/api/songs/preview", method: "POST" },
]

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const method = request.method

  // Skip auth work entirely for the public read-only API allowlist.
  if (pathname.startsWith("/api/songs") && PUBLIC_API.some((p) => p.path === pathname && p.method === method)) {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)
  const authed = !!user && user.email === process.env.ADMIN_EMAIL

  // Any other /api/songs/* request is a mutation → require the owner.
  if (pathname.startsWith("/api/songs")) {
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return response
  }

  // Admin pages → redirect to login, preserving the intended destination.
  if (!authed) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/add/:path*",
    "/date/:path*",
    "/manual/:path*",
    "/sync/:path*",
    "/star/:path*",
    "/delete/:path*",
    "/api/songs/:path*",
  ],
}
