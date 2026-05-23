"use client"

import { useState } from "react"
import { TwitterEmbed } from "@/components/twitter-embed"

export interface MrwSong {
  title: string
  artist: string
  plays: number
  cover?: string | null
  spotify?: string | null
}

export interface MrwGroup {
  date: string // 'DD/MM/YYYY'
  count: number
  songs: MrwSong[]
}

export interface MrwStats {
  totalSongs: number
  uniqueCount: number
  daysTracked: number
  totalPlays: number
  avgPerDay: string
  heaviestDay: { date: string; count: number } | null
  lastPosted: { title: string; artist: string } | null
  topArtists: { name: string; count: number }[]
  topSongs: { title: string; artist: string; count: number }[]
  heroTimeLabel: string
  firstSongDate: string
}

interface MrwSiteProps {
  groups: MrwGroup[]
  stats: MrwStats
  tweetHtml: string
}

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const PAD = 16 // regular density

function parseDate(d: string) {
  const [dd, mm, yyyy] = d.split("/").map(Number)
  return new Date(yyyy, mm - 1, dd)
}

function monthKey(d: string) {
  const dt = parseDate(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-")
  return `${MONTHS_SHORT[+m - 1]} ${y}`
}

function formatDateShort(d: string) {
  const dt = parseDate(d)
  return {
    day: String(dt.getDate()).padStart(2, "0"),
    mon: MONTHS_SHORT[dt.getMonth()],
    year: dt.getFullYear(),
  }
}

function CoverGlyph({ title, size = 56 }: { title: string; size?: number }) {
  const ch = (title || "?").replace(/[^a-z0-9]/gi, "").charAt(0).toUpperCase() || "#"
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: "var(--mrw-w-12)",
        border: "1px solid var(--mrw-w-25)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-ndot), monospace",
        fontSize: size * 0.38,
        color: "var(--mrw-w-60)",
      }}
    >
      {ch}
    </div>
  )
}

function Cover({ song, size = 56 }: { song: MrwSong; size?: number }) {
  const [ok, setOk] = useState(true)
  if (!ok || !song.cover) return <CoverGlyph title={song.title} size={size} />
  return (
    <img
      src={song.cover || "/placeholder.svg"}
      alt=""
      onError={() => setOk(false)}
      style={{ width: size, height: size, flexShrink: 0, display: "block", objectFit: "cover" }}
    />
  )
}

function SitePill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="mrw-ndot"
      style={{
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        padding: "5px 11px",
        border: "1px solid " + (active ? "var(--mrw-white)" : "var(--mrw-w-25)"),
        background: active ? "var(--mrw-white)" : "transparent",
        color: active ? "var(--mrw-blue)" : "var(--mrw-white)",
        cursor: "pointer",
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  )
}

function DayBlockTimeline({ group }: { group: MrwGroup }) {
  const ds = formatDateShort(group.date)
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        gap: 22,
        paddingTop: 22,
        paddingBottom: 22,
        borderTop: "1px solid var(--mrw-w-12)",
      }}
    >
      <div style={{ position: "sticky", top: 24, alignSelf: "flex-start" }}>
        <p className="mrw-ndot" style={{ margin: 0, fontSize: 30, lineHeight: 1, color: "var(--mrw-white)" }}>
          {ds.day}
        </p>
        <p className="mrw-ndot" style={{ margin: "8px 0 0", fontSize: 10, letterSpacing: "0.22em", color: "var(--mrw-w-60)" }}>
          {ds.mon} {String(ds.year).slice(-2)}
        </p>
        <p className="mrw-ndot" style={{ margin: "12px 0 0", fontSize: 9, letterSpacing: "0.16em", color: "var(--mrw-w-45)" }}>
          {group.songs.length} {group.songs.length === 1 ? "song" : "songs"}
        </p>
      </div>

      <div>
        {group.songs.map((s, i) => {
          const Row = s.spotify ? "a" : "div"
          return (
            <Row
              key={i}
              {...(s.spotify ? { href: s.spotify, target: "_blank", rel: "noopener noreferrer" } : {})}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: `${PAD}px 0`,
                textDecoration: "none",
                color: "inherit",
                borderBottom: i < group.songs.length - 1 ? "1px solid var(--mrw-w-06)" : "none",
                transition: "opacity .15s",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.opacity = "1")}
            >
              <Cover song={s} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="mrw-serif"
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontStyle: "italic",
                    lineHeight: 1.2,
                    color: "var(--mrw-white)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {s.title}
                </p>
                <p
                  className="mrw-serif"
                  style={{
                    margin: "3px 0 0",
                    fontSize: 13.5,
                    color: "var(--mrw-w-60)",
                    overflowWrap: "anywhere",
                  }}
                >
                  {s.artist}
                </p>
              </div>
              {s.plays > 1 && (
                <span className="mrw-ndot" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--mrw-white)" }}>
                  ×{s.plays}
                </span>
              )}
            </Row>
          )
        })}
      </div>
    </div>
  )
}

function BigNumLeft({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <p className="mrw-ndot" style={{ margin: 0, fontSize: 64, lineHeight: 0.85, color: "var(--mrw-white)", minWidth: 110 }}>
        {value}
      </p>
      <p
        className="mrw-ndot"
        style={{
          margin: 0,
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--mrw-w-60)",
          maxWidth: 80,
          lineHeight: 1.3,
        }}
      >
        {label}
      </p>
    </div>
  )
}

function StatRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "baseline", gap: 14 }}>
      <p className="mrw-ndot" style={{ margin: 0, fontSize: 9, letterSpacing: "0.22em", color: "var(--mrw-w-45)" }}>
        {k}
      </p>
      <p className="mrw-serif" style={{ margin: 0, fontSize: 15, fontStyle: "italic", color: "var(--mrw-white)" }}>
        {v}
      </p>
    </div>
  )
}

export function MrwSite({ groups, stats, tweetHtml }: MrwSiteProps) {
  const [query, setQuery] = useState("")
  const [month, setMonth] = useState("all")
  const [artist, setArtist] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const filtered = groups
    .filter((g) => month === "all" || monthKey(g.date) === month)
    .map((g) => ({
      ...g,
      songs: g.songs.filter((s) => {
        const q = query.trim().toLowerCase()
        if (artist !== "all" && !s.artist.toLowerCase().includes(artist.toLowerCase())) return false
        if (q && !(s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))) return false
        return true
      }),
    }))
    .filter((g) => g.songs.length > 0)

  const months = Array.from(new Set(groups.map((g) => monthKey(g.date)))).sort().reverse().slice(0, 6)
  const artistPills = stats.topArtists.slice(0, 5).map((a) => a.name)

  const lastGroup = groups[0]
  const lastSong = lastGroup?.songs[0]
  const maxArtist = stats.topArtists[0]?.count || 1
  const maxSong = stats.topSongs[0]?.count || 1

  const scrollToStats = () => {
    const el = document.getElementById("mrw-stats")
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 24
    window.scrollTo({ top, behavior: "smooth" })
  }

  return (
    <div className="mrw-page" style={{ padding: "64px 32px 0" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {/* ── HERO ── */}
        <header style={{ textAlign: "center", paddingTop: 24, paddingBottom: 88 }}>
          <p
            className="mrw-ndot"
            style={{ margin: 0, fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase", color: "var(--mrw-w-45)" }}
          >
            posting history · 2025/2026
          </p>
          <h1
            className="mrw-ndot"
            style={{
              margin: "32px 0 32px",
              fontSize: "clamp(48px, 11vw, 84px)",
              lineHeight: 0.92,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--mrw-white)",
            }}
          >
            Matteo
            <br />
            Ruggeri
          </h1>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={scrollToStats}
              className="mrw-ndot"
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--mrw-blue)",
                background: "var(--mrw-white)",
                padding: "11px 18px",
                cursor: "pointer",
                border: "1px solid var(--mrw-white)",
                transition: "transform .15s ease, background .15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              ↓ &nbsp;view stats
            </button>
            <a
              href="#mrw-history"
              className="mrw-ndot"
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--mrw-white)",
                padding: "11px 18px",
                border: "1px solid var(--mrw-w-45)",
                textDecoration: "none",
                transition: "background .15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mrw-w-12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              ↡ &nbsp;history
            </a>
          </div>
        </header>

        {/* ── LAST POSTED ── */}
        {lastSong && (
          <section style={{ textAlign: "center", paddingBottom: 88 }}>
            <p
              className="mrw-ndot"
              style={{ margin: 0, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--mrw-w-45)" }}
            >
              Last posted
            </p>
            <p
              className="mrw-ndot"
              style={{ margin: "10px 0 32px", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--mrw-w-60)" }}
            >
              Impulsed by Opium
            </p>

            {lastSong.spotify ? (
              <a href={lastSong.spotify} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginBottom: 28 }}>
                <Cover song={lastSong} size={240} />
              </a>
            ) : (
              <div style={{ display: "inline-block", marginBottom: 28 }}>
                <Cover song={lastSong} size={240} />
              </div>
            )}

            <h2
              className="mrw-serif"
              style={{
                margin: "0 0 8px",
                fontSize: "clamp(30px, 5.4vw, 42px)",
                lineHeight: 1.05,
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--mrw-white)",
              }}
            >
              {lastSong.title}
            </h2>
            <p className="mrw-serif" style={{ margin: "0 0 14px", fontSize: 18, color: "var(--mrw-w-80)" }}>
              {lastSong.artist}
            </p>
            {lastSong.plays > 1 && (
              <p className="mrw-ndot" style={{ margin: 0, fontSize: 11, letterSpacing: "0.2em", color: "var(--mrw-white)" }}>
                ×{lastSong.plays} repeats
              </p>
            )}
            {stats.heroTimeLabel && (
              <p
                className="mrw-ndot"
                style={{
                  display: "inline-block",
                  margin: "28px 0 0",
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--mrw-white)",
                  padding: "5px 12px",
                  border: "1px solid var(--mrw-w-45)",
                }}
              >
                {stats.heroTimeLabel}
              </p>
            )}
          </section>
        )}

        {/* ── HISTORY ── */}
        <section id="mrw-history" style={{ scrollMarginTop: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              paddingBottom: 24,
              borderBottom: "1px solid var(--mrw-w-25)",
            }}
          >
            <p className="mrw-ndot" style={{ margin: 0, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase" }}>
              History
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span className="mrw-ndot" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--mrw-w-60)" }}>
                {stats.uniqueCount} unique · {stats.totalSongs} total
              </span>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="mrw-ndot"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--mrw-white)",
                  cursor: "pointer",
                  padding: "4px 10px",
                  border: "1px solid var(--mrw-w-45)",
                  background: showFilters ? "var(--mrw-w-12)" : "transparent",
                }}
              >
                {showFilters ? "close" : "filter"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div
              className="mrw-fade-enter"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "20px 0",
                borderBottom: "1px solid var(--mrw-w-12)",
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search title or artist…"
                className="mrw-serif mrw-input"
                style={{
                  fontSize: 16,
                  fontStyle: "italic",
                  background: "transparent",
                  border: 0,
                  borderBottom: "1px solid var(--mrw-w-25)",
                  padding: "6px 0",
                  color: "var(--mrw-white)",
                  outline: "none",
                  width: "100%",
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SitePill active={month === "all"} onClick={() => setMonth("all")}>
                  all months
                </SitePill>
                {months.map((m) => (
                  <SitePill key={m} active={month === m} onClick={() => setMonth(m)}>
                    {monthLabel(m)}
                  </SitePill>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SitePill active={artist === "all"} onClick={() => setArtist("all")}>
                  all artists
                </SitePill>
                {artistPills.map((a) => (
                  <SitePill key={a} active={artist === a} onClick={() => setArtist(a)}>
                    {a}
                  </SitePill>
                ))}
              </div>
            </div>
          )}

          <div style={{ paddingTop: 28 }}>
            {filtered.length === 0 && (
              <p
                className="mrw-serif"
                style={{ textAlign: "center", fontStyle: "italic", color: "var(--mrw-w-45)", padding: "40px 0" }}
              >
                no matches.
              </p>
            )}
            {filtered.map((g) => (
              <DayBlockTimeline key={g.date} group={g} />
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section id="mrw-stats" style={{ marginTop: 120, paddingTop: 56, scrollMarginTop: 24, borderTop: "1px solid var(--mrw-w-25)" }}>
          <h2
            className="mrw-ndot"
            style={{
              margin: 0,
              fontSize: "clamp(56px, 12vw, 92px)",
              lineHeight: 0.9,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--mrw-white)",
              textAlign: "center",
            }}
          >
            Season
            <br />
            Stats
          </h2>

          <div style={{ position: "relative", marginTop: 24, minHeight: 460 }}>
            <img
              src="/ruggeri-cutout.png"
              alt="Matteo Ruggeri"
              style={{ position: "absolute", right: -24, top: 0, width: "70%", height: "auto", display: "block", pointerEvents: "none" }}
            />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28, paddingTop: 32 }}>
              <BigNumLeft label="songs posted" value={stats.totalSongs} />
              <BigNumLeft label="unique tracks" value={stats.uniqueCount} />
              <BigNumLeft label="days tracked" value={stats.daysTracked} />
              <BigNumLeft label="total plays" value={stats.totalPlays} />
            </div>
          </div>

          <div
            style={{
              marginTop: 32,
              padding: "22px 0 0",
              borderTop: "1px dashed var(--mrw-w-25)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <StatRow k="AVG / DAY" v={`${stats.avgPerDay} songs`} />
            {stats.heaviestDay && <StatRow k="HEAVIEST DAY" v={`${stats.heaviestDay.date} — ${stats.heaviestDay.count} songs`} />}
            {stats.lastPosted && <StatRow k="LAST POSTED" v={`${stats.lastPosted.title} · ${stats.lastPosted.artist}`} />}
            {stats.firstSongDate && <StatRow k="TRACKING SINCE" v={stats.firstSongDate} />}
          </div>

          <div style={{ marginTop: 56 }}>
            <p className="mrw-ndot" style={{ margin: "0 0 24px", fontSize: 10, letterSpacing: "0.32em", color: "var(--mrw-w-45)" }}>
              ## TOP ARTISTS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.topArtists.map((a, i) => {
                const pct = (a.count / maxArtist) * 100
                return (
                  <div key={a.name} style={{ display: "grid", gridTemplateColumns: "24px 1fr 44px", gap: 12, alignItems: "center" }}>
                    <p className="mrw-ndot" style={{ margin: 0, fontSize: 12, color: "var(--mrw-w-45)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <div style={{ position: "relative", minHeight: 28, display: "flex", alignItems: "center" }}>
                      <div style={{ position: "absolute", inset: 0, background: "var(--mrw-w-12)", width: `${pct}%` }} />
                      <p
                        className="mrw-serif"
                        style={{
                          margin: 0,
                          fontSize: 17,
                          fontStyle: "italic",
                          position: "relative",
                          padding: "4px 8px 4px 10px",
                          color: "var(--mrw-white)",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {a.name}
                      </p>
                    </div>
                    <p className="mrw-ndot" style={{ margin: 0, fontSize: 12, color: "var(--mrw-white)", textAlign: "right" }}>
                      ×{a.count}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 56 }}>
            <p className="mrw-ndot" style={{ margin: "0 0 24px", fontSize: 10, letterSpacing: "0.32em", color: "var(--mrw-w-45)" }}>
              ## TOP SONGS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.topSongs.map((s, i) => {
                const pct = (s.count / maxSong) * 100
                return (
                  <div
                    key={`${s.title}-${i}`}
                    style={{ display: "grid", gridTemplateColumns: "24px 1fr 44px", gap: 12, alignItems: "center" }}
                  >
                    <p className="mrw-ndot" style={{ margin: 0, fontSize: 12, color: "var(--mrw-w-45)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <div style={{ position: "relative", minHeight: 28, display: "flex", alignItems: "center" }}>
                      <div style={{ position: "absolute", inset: 0, background: "var(--mrw-w-12)", width: `${pct}%` }} />
                      <div style={{ position: "relative", padding: "4px 8px 4px 10px", minWidth: 0 }}>
                        <p
                          className="mrw-serif"
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontStyle: "italic",
                            lineHeight: 1.2,
                            color: "var(--mrw-white)",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {s.title}
                        </p>
                        <p
                          className="mrw-serif"
                          style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mrw-w-60)", overflowWrap: "anywhere" }}
                        >
                          {s.artist}
                        </p>
                      </div>
                    </div>
                    <p className="mrw-ndot" style={{ margin: 0, fontSize: 12, color: "var(--mrw-white)", textAlign: "right" }}>
                      ×{s.count}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── TWITTER ── */}
        {tweetHtml && <TwitterEmbed tweetHtml={tweetHtml} />}

        {/* ── FOOTER ── */}
        <footer
          style={{
            marginTop: 96,
            paddingTop: 32,
            paddingBottom: 32,
            borderTop: "1px solid var(--mrw-w-12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <p
            className="mrw-serif"
            style={{ margin: 0, fontSize: 11, fontStyle: "italic", color: "var(--mrw-w-45)", textAlign: "center", lineHeight: 1.5, maxWidth: 360 }}
          >
            * Tracking before 18/12/2025 may be inaccurate and is not included in the average calculation.
          </p>
          <img src="/ivanmi-logo.png" alt="ivanmi studios" style={{ height: 72, width: "auto", opacity: 0.95 }} />
        </footer>
      </div>
    </div>
  )
}
