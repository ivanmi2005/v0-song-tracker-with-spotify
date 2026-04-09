"use client"

import { useState } from "react"
import Link from "next/link"
import { PinAuth } from "@/components/pin-auth"
import { SpotifyDateForm } from "@/components/spotify-date-form"
import { ManualEntryForm } from "@/components/manual-entry-form"
import { SyncManager } from "@/components/sync-manager"
import { StarManager } from "@/components/star-manager"
import { DeleteSongList } from "@/components/delete-song-list"

const tabs = [
  { id: "date", label: "Con fecha" },
  { id: "manual", label: "Manual" },
  { id: "sync", label: "Sync" },
  { id: "stars", label: "Stars" },
  { id: "delete", label: "Eliminar" },
] as const

type TabId = (typeof tabs)[number]["id"]

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("date")

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-16">
        <header className="mb-10">
          <Link
            href="/"
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mt-8 mb-2">Admin</h1>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-10 border-b border-border pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? "text-foreground bg-foreground/10"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "date" && (
            <section>
              <p className="text-xs text-muted-foreground/60 italic mb-6">
                Añadir canción de Spotify con fecha personalizada
              </p>
              <SpotifyDateForm />
            </section>
          )}

          {activeTab === "manual" && (
            <section>
              <p className="text-xs text-muted-foreground/60 italic mb-6">
                Crear entrada manual para sincronizar después con Spotify
              </p>
              <ManualEntryForm />
            </section>
          )}

          {activeTab === "sync" && (
            <section>
              <SyncManager />
            </section>
          )}

          {activeTab === "stars" && (
            <section>
              <StarManager />
            </section>
          )}

          {activeTab === "delete" && (
            <section>
              <DeleteSongList />
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

export default function AdminPage() {
  return (
    <PinAuth>
      <AdminPanel />
    </PinAuth>
  )
}
