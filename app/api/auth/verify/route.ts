import { NextResponse } from "next/server"
import { createHash } from "crypto"

export async function POST(request: Request) {
  try {
    const { token, verification } = await request.json()

    if (!token || !verification || typeof token !== "string" || typeof verification !== "string") {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const authPin = process.env.AUTH_PIN
    if (!authPin) {
      return NextResponse.json({ valid: false }, { status: 500 })
    }

    const expectedVerification = createHash("sha256").update(token + authPin).digest("hex")

    if (expectedVerification === verification) {
      return NextResponse.json({ valid: true })
    }

    return NextResponse.json({ valid: false }, { status: 401 })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
