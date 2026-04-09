import { NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"
import { searchSpotifyTrack } from "@/lib/spotify"

const CORRECT_SONG_ID = "60GKG0wbJXlwYLV6JwpNkO" // BANE - Lucho RK

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()
    console.log("[v0] Login attempt with query:", pin)
    
    // Search for the song using Spotify API
    const songData = await searchSpotifyTrack(pin)
    console.log("[v0] Spotify search result:", songData ? `${songData.name} by ${songData.artists[0].name} (ID: ${songData.id})` : "No result")
    
    if (!songData) {
      return NextResponse.json({ error: "Canción no encontrada en Spotify" }, { status: 401 })
    }
    
    // Check if it's the correct song
    console.log("[v0] Comparing IDs - Found:", songData.id, "Expected:", CORRECT_SONG_ID)
    if (songData.id !== CORRECT_SONG_ID) {
      return NextResponse.json({ 
        error: `Canción incorrecta. Encontrado: ${songData.name} por ${songData.artists[0].name}` 
      }, { status: 401 })
    }
    
    console.log("[v0] Correct song found! Generating token...")
    
    // Generate a secure token
    const tokenData = `${songData.id}-${Date.now()}-${randomBytes(16).toString("hex")}`
    const token = createHash("sha256").update(tokenData).digest("hex")
    
    const tokenSecret = songData.id + "-secret"
    const verificationHash = createHash("sha256").update(token + tokenSecret).digest("hex")
    
    return NextResponse.json({ 
      token,
      verification: verificationHash 
    })
    
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Error al buscar canción" }, { status: 500 })
  }
}
