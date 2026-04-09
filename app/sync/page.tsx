import { SyncManager } from "@/components/sync-manager"
import Link from "next/link"

export default function SyncPage() {
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
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mt-8 mb-2">Sync Songs</h1>
          <p className="text-muted-foreground">Sincroniza entradas manuales con Spotify</p>
        </header>

        <SyncManager />

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground/60 italic">
            Las entradas sincronizadas tendrán todos los datos de Spotify (portada, artistas, álbum)
          </p>
        </div>
      </div>
    </main>
  )
}
