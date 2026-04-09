"use client"

import React, { useState, useEffect } from "react"

const AUTH_STORAGE_KEY = "matteo_tracker_auth"

interface StoredAuth {
  token: string
  verification: string
}

interface PinAuthProps {
  children: React.ReactNode
}

export function PinAuth({ children }: PinAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        const auth: StoredAuth = JSON.parse(stored)
        if (auth.token && auth.verification) {
          verifyToken(auth)
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          setIsAuthenticated(false)
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  async function verifyToken(auth: StoredAuth) {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: auth.token, verification: auth.verification }),
      })

      if (res.ok) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        setSessionExpired(true)
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      const data = await res.json()

      if (res.ok && data.token && data.verification) {
        const auth: StoredAuth = { token: data.token, verification: data.verification }
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
        setSessionExpired(false)
        setIsAuthenticated(true)
      } else {
        setError(data.error || "PIN incorrecto")
        setPin("")
      }
    } catch {
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
          {sessionExpired ? (
            <p className="text-sm text-amber-500">Sesión expirada, vuelve a iniciar sesión</p>
          ) : (
            <p className="text-sm text-muted-foreground">Introduce el PIN de acceso</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
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
            {isLoading ? "Verificando..." : "Acceder"}
          </button>
        </form>
      </div>
    </main>
  )
}
