import { NextResponse } from "next/server"
import { createSessionToken, verifyPassword, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!verifyPassword(password)) {
      // Encarece la fuerza bruta sin necesitar estado compartido.
      await new Promise((r) => setTimeout(r, 500))
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    const token = await createSessionToken()
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })
    return response
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
