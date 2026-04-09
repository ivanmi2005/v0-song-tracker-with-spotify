"use client"

import React from "react"

import { useState, useEffect } from "react"

const AUTH_STORAGE_KEY = "matteo_tracker_auth"

interface PinAuthProps {
  children: React.ReactNode
}

export function PinAuth({ children }: PinAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedToken) {
      verifyToken(storedToken)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  async function verifyToken(token: string) {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      
      if (res.ok) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("[v0] Attempting login with query:", pin)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      const data = await res.json()
      console.log("[v0] Login response:", res.status, data)

      if (res.ok && data.token) {
        localStorage.setItem(AUTH_STORAGE_KEY, data.token)
        setIsAuthenticated(true)
      } else {
        setError(data.error || "Error desconocido")
        setPin("")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-mono text-sm">Verificando...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-32">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-light tracking-tight text-foreground mb-2">Acceso Restringido</h1>
          <p className="text-sm text-muted-foreground">Busca la canción correcta en Spotify</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Buscar canción..."
              className="w-full text-center bg-transparent border-b-2 border-border py-4 focus:outline-none focus:border-foreground transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!pin || isLoading}
            className="w-full py-3 bg-foreground text-background font-mono text-sm uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Buscando..." : "Verificar"}
          </button>
        </form>
      </div>
    </main>
  )
}
