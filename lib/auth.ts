import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Single owner password. Server-side only — never shipped to the browser.
// To change it, edit this value (and redeploy).
const ADMIN_PASSWORD = "1NgPsOCpVLLQWzeGswWc"

export const SESSION_COOKIE = "mrw_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days (seconds)

const encoder = new TextEncoder()

function base64url(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  return atob(b64)
}

// HMAC-SHA256 via Web Crypto so the same code runs on Edge (middleware) and Node.
async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ADMIN_PASSWORD),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return base64url(new Uint8Array(sig))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export function verifyPassword(input: unknown): boolean {
  if (typeof input !== "string") return false
  return timingSafeEqual(input.trim(), ADMIN_PASSWORD)
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE * 1000
  const payload = base64url(encoder.encode(JSON.stringify({ exp })))
  const sig = await hmac(payload)
  return `${payload}.${sig}`
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return false

  const expected = await hmac(payload)
  if (!timingSafeEqual(sig, expected)) return false

  try {
    const { exp } = JSON.parse(fromBase64url(payload)) as { exp?: number }
    return typeof exp === "number" && exp > Date.now()
  } catch {
    return false
  }
}

// Defense-in-depth guard for route handlers. Returns a 401 response when the
// caller has no valid session cookie, or null when access is granted.
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const ok = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
