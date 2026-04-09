"use client"

import { useState } from "react"

interface StarredData {
  main_video_url: string | null
  link_1: string | null
  link_2: string | null
  link_3: string | null
  link_4: string | null
  link_5: string | null
}

interface StarredSongOverlayProps {
  starredMap: Record<string, StarredData>
}

export function StarredSongOverlay({ starredMap }: StarredSongOverlayProps) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)

  const activeData = activeTrackId ? starredMap[activeTrackId] : null

  const extraLinks = activeData
    ? [activeData.link_1, activeData.link_2, activeData.link_3, activeData.link_4, activeData.link_5].filter(Boolean)
    : []

  return (
    <>
      {/* Star buttons rendered via portal-like approach - expose handler globally */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__starredSongs = ${JSON.stringify(Object.keys(starredMap))};`,
        }}
      />

      {/* Popup overlay */}
      {activeTrackId && activeData && (
        <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <button
              onClick={() => setActiveTrackId(null)}
              className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-8 block"
            >
              ← Close
            </button>

            {/* Main video embed */}
            {activeData.main_video_url && (
              <div className="mb-8 w-full">
                {activeData.main_video_url.includes("streamain.com") ||
                activeData.main_video_url.includes("youtube.com") ||
                activeData.main_video_url.includes("youtu.be") ||
                activeData.main_video_url.includes("vimeo.com") ? (
                  <iframe
                    src={activeData.main_video_url}
                    title="Video embed"
                    className="w-full aspect-video bg-secondary border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <video
                    src={activeData.main_video_url}
                    controls
                    className="w-full aspect-video bg-secondary"
                    playsInline
                  />
                )}
              </div>
            )}

            {/* Extra links */}
            {extraLinks.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">
                  More links
                </p>
                {extraLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-3 border-b border-border/30 hover:bg-secondary/30 transition-colors group"
                  >
                    <span className="text-xs font-mono text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-foreground group-hover:underline truncate">{link}</span>
                    <svg
                      className="w-3 h-3 text-muted-foreground/40 shrink-0 ml-auto"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expose the setter for star clicks */}
      <StarClickHandler onOpen={setActiveTrackId} starredMap={starredMap} />
    </>
  )
}

function StarClickHandler({
  onOpen,
  starredMap,
}: {
  onOpen: (trackId: string) => void
  starredMap: Record<string, StarredData>
}) {
  // Attach click handlers to star icons
  if (typeof window !== "undefined") {
    ;(window as any).__openStarPopup = (trackId: string) => {
      if (starredMap[trackId]) {
        onOpen(trackId)
      }
    }
  }

  return null
}
