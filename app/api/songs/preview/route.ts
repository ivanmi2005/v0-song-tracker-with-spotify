import { type NextRequest, NextResponse } from "next/server"
import { extractTrackIdFromUrl, getSpotifyTrack, searchSpotifyTrack, type ApiSource } from "@/lib/spotify"

export async function POST(request: NextRequest) {
  try {
    const { input, apiSource } = await request.json()

    if (!input) {
      return NextResponse.json({ error: "URL o título de canción requerido" }, { status: 400 })
    }

    const source = apiSource as ApiSource | undefined
    let track

    const trackId = extractTrackIdFromUrl(input)

    if (trackId) {
      track = await getSpotifyTrack(trackId, source)
      if (!track) {
        return NextResponse.json({ error: "No se pudo obtener información de la canción" }, { status: 404 })
      }
    } else {
      track = await searchSpotifyTrack(input, source)
      if (!track) {
        return NextResponse.json(
          { error: "No se encontró la canción. Intenta con otro título o URL." },
          { status: 404 },
        )
      }
    }

    return NextResponse.json({ track })
  } catch {
    return NextResponse.json({ error: "Error al buscar la canción" }, { status: 500 })
  }
}
