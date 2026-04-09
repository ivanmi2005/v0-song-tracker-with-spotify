"use client"

import { AddSongForm } from "@/components/add-song-form"
import Link from "next/link"
import { useEffect } from "react"
import { sileo } from "sileo"

export default function AddPage() {
  useEffect(() => {
    // Show connection toasts on page load
    sileo.info({ title: "Conectando..." })
    
    const timer = setTimeout(() => {
      sileo.success({ title: "Conectado" })
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-16">
        <header className="mb-12">
          <Link
            href="/"
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mt-8 mb-2">Add Song</h1>
          <p className="text-muted-foreground">Paste a Spotify track URL or search by name</p>
        </header>

        <AddSongForm />

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-4">How to get the link</p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open Spotify and find the song</li>
            <li>Click the three dots (···)</li>
            <li>{"Select \"Share\" → \"Copy song link\""}</li>
            <li>Paste it here</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
