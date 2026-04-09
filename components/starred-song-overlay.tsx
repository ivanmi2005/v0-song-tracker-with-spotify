"use client"

import { useState, useEffect } from "react"

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

  useEffect(() => {
    (window as Record<string, unknown>).__openStarPopup = (trackId: string) => {
      if (starredMap[trackId]) {
        setActiveTrackId(trackId)
      }
    }
    return () => {
      delete (window as Record<string, unknown>).__openStarPopup
    }
  }, [starredMap])

  const activeData = activeTrackId ? starredMap[activeTrackId] : null

  const extraLinks = activeData
    ? [activeData.link_1, activeData.link_2, activeData.link_3, activeData.link_4, activeData.link_5].filter(Boolean)
    : []

  return (
    <>
      {activeTrackId && activeData && (
        <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <button
              onClick={() => setActiveTrackId(null)}
              className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-8 block"
            >
              ← Close
            </button>

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
                    sandbox="allow-scripts allow-same-origin allow-fullscreen"
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
    </>
  )
}
