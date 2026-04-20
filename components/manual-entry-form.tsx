"use client"

import { useState } from "react"
import { sileo } from "sileo"

export function ManualEntryForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [manualData, setManualData] = useState({
    trackName: "",
    artistName: "",
    albumName: "",
    dateValue: "",
  })

  function buildISODate(value: string): string {
    return new Date(`${value}T12:00:00`).toISOString()
  }

  function isDateValid(value: string): boolean {
    if (!value) return false
    const year = parseInt(value.split("-")[0])
    return year >= 2020 && year <= 2030
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { trackName, artistName, albumName, dateValue } = manualData
    if (!trackName || !artistName || !isDateValid(dateValue)) {
      sileo.warning({ title: "Rellena todos los campos obligatorios" })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/songs/add-with-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          trackName,
          artistName,
          albumName: albumName || undefined,
          customDate: buildISODate(dateValue),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        sileo.error({ title: data.error || "Error al añadir" })
      } else {
        sileo.success({ title: "Entrada manual creada — sincronízala en la pestaña Sync" })
        setManualData({ trackName: "", artistName: "", albumName: "", dateValue: "" })
      }
    } catch {
      sileo.error({ title: "Error de conexión" })
    } finally {
      setIsLoading(false)
    }
  }

  const fieldClass =
    "w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-[oklch(0.72_0_0)] focus:outline-none focus:border-foreground transition-colors font-mono text-[0.8rem]"
  const labelClass =
    "block font-mono text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground mb-[0.6rem]"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Nombre de la canción</label>
        <input
          type="text"
          value={manualData.trackName}
          onChange={(e) => setManualData({ ...manualData, trackName: e.target.value })}
          placeholder="ESCALOFRÍOS"
          className={fieldClass}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <div>
        <label className={labelClass}>Artista</label>
        <input
          type="text"
          value={manualData.artistName}
          onChange={(e) => setManualData({ ...manualData, artistName: e.target.value })}
          placeholder="Mora"
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className={labelClass}>
          Álbum{" "}
          <span className="text-muted-foreground/50 normal-case tracking-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={manualData.albumName}
          onChange={(e) => setManualData({ ...manualData, albumName: e.target.value })}
          placeholder="TRAP CAMELLO"
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className={labelClass}>Fecha</label>
        <input
          type="date"
          value={manualData.dateValue}
          onChange={(e) => setManualData({ ...manualData, dateValue: e.target.value })}
          min="2020-01-01"
          max="2030-12-31"
          className={fieldClass}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={
          isLoading ||
          !manualData.trackName ||
          !manualData.artistName ||
          !isDateValid(manualData.dateValue)
        }
        className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {isLoading ? "Creando..." : "Crear entrada manual"}
      </button>
    </form>
  )
}
