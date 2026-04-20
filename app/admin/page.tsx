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
    <main className="min-h-screen bg-background font-sans">
      <div className="max-w-[28rem] mx-auto px-6 pt-16 pb-24">
        <Link
          href="/"
          className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors inline-block mb-10"
        >
          ← Back
        </Link>

        <h1 className="font-sans font-medium text-[clamp(1.8rem,5vw,2.5rem)] tracking-[-0.03em] leading-none text-foreground mb-10">
          Admin
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-[2px] border-b border-border pb-3 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 font-mono text-[0.6rem] tracking-[0.14em] uppercase transition-colors ${
                activeTab === tab.id
                  ? "text-foreground bg-[oklch(0.94_0_0)]"
                  : "text-[oklch(0.65_0_0)] hover:text-foreground"
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
              <p className="font-mono text-[0.65rem] italic text-[oklch(0.65_0_0)] mb-6">
                Añadir canción de Spotify con fecha personalizada
              </p>
              <SpotifyDateForm />
            </section>
          )}

          {activeTab === "manual" && (
            <section>
              <p className="font-mono text-[0.65rem] italic text-[oklch(0.65_0_0)] mb-6">
                Crear entrada manual para sincronizar después con Spotify
              </p>
              <ManualEntryForm />
            </section>
          )}

          {activeTab === "sync" && (
            <section>
              <p className="font-mono text-[0.65rem] italic text-[oklch(0.65_0_0)] mb-6">
                Sincronizar entradas manuales con Spotify
              </p>
              <SyncManager />
            </section>
          )}

          {activeTab === "stars" && (
            <section>
              <p className="font-mono text-[0.65rem] italic text-[oklch(0.65_0_0)] mb-6">
                Gestionar canciones destacadas
              </p>
              <StarManager />
            </section>
          )}

          {activeTab === "delete" && (
            <section>
              <p className="font-mono text-[0.65rem] italic text-[oklch(0.65_0_0)] mb-6">
                Eliminar entradas del historial
              </p>
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
