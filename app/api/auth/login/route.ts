import { NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN requerido" }, { status: 400 })
    }

    const authPin = process.env.AUTH_PIN
    if (!authPin) {
      return NextResponse.json({ error: "Auth no configurado en servidor" }, { status: 500 })
    }

    const inputHash = createHash("sha256").update(pin.trim()).digest("hex")
    const correctHash = createHash("sha256").update(authPin).digest("hex")

    if (inputHash !== correctHash) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 })
    }

    const tokenData = `${Date.now()}-${randomBytes(32).toString("hex")}`
    const token = createHash("sha256").update(tokenData).digest("hex")
    const verificationHash = createHash("sha256").update(token + authPin).digest("hex")

    return NextResponse.json({ token, verification: verificationHash })
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
