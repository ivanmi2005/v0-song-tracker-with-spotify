import { SpotifyDateForm } from "@/components/spotify-date-form"
import Link from "next/link"

export default function DatePage() {
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
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mt-8 mb-2">Add with Date</h1>
          <p className="text-muted-foreground">Add a Spotify song with a custom date</p>
        </header>

        <SpotifyDateForm />

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground/60 italic">
            Use this to add songs from Spotify with a custom date from the past
          </p>
        </div>
      </div>
    </main>
  )
}
