import { StarManager } from "@/components/star-manager"
import Link from "next/link"

export default function StarPage() {
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
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mt-8 mb-2">Star Songs</h1>
          <p className="text-muted-foreground">Select a song to star and add video links</p>
        </header>

        <StarManager />
      </div>
    </main>
  )
}
