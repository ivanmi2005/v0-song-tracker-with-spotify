"use client"

import { AddSongForm } from "@/components/add-song-form"
import Link from "next/link"
import { PinAuth } from "@/components/pin-auth"

function AddPage() {
  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="max-w-[28rem] mx-auto px-6 pt-16 pb-24">
        <Link
          href="/"
          className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors inline-block mb-10"
        >
          ← Back
        </Link>

        <h1 className="font-sans font-medium text-[clamp(1.8rem,5vw,2.5rem)] tracking-[-0.03em] leading-none text-foreground mb-2">
          Add Song
        </h1>
        <p className="font-mono text-[0.7rem] text-muted-foreground mb-12">
          Paste a Spotify track URL or search by name
        </p>

        <AddSongForm />

        <hr className="border-none border-t border-border my-10" />

        <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground block mb-4">
          Cómo obtener el enlace
        </span>
        <ol className="font-mono text-[0.7rem] text-muted-foreground leading-loose list-decimal list-inside">
          <li>Open Spotify and find the song</li>
          <li>Click the three dots (···)</li>
          <li>{"Select \"Share\" → \"Copy song link\""}</li>
          <li>Paste it here</li>
        </ol>
      </div>
    </main>
  )
}

export default function AddPageWithAuth() {
  return (
    <PinAuth>
      <AddPage />
    </PinAuth>
  )
}
