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
      <main className="min-h-screen bg-background flex items-center justify-center font-sans">
        <p className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-muted-foreground">
          Verificando...
        </p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="max-w-[22rem] mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="font-sans font-medium text-[1.8rem] tracking-[-0.03em] leading-none text-foreground mb-2">
          Acceso Restringido
        </h1>

        {sessionExpired ? (
          <p className="font-mono text-[0.65rem] text-amber-500 mb-12">
            Sesión expirada, vuelve a iniciar sesión
          </p>
        ) : (
          <p className="font-mono text-[0.7rem] text-muted-foreground mb-12">
            Introduce el PIN de acceso
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError("")
            }}
            placeholder="········"
            maxLength={8}
            className="w-full text-center bg-transparent border-b-[1.5px] border-border py-4 text-[1.5rem] tracking-[0.4em] focus:outline-none focus:border-foreground transition-colors text-foreground mb-8"
            autoFocus
          />

          {error && (
            <p className="font-mono text-[0.65rem] text-red-600 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={!pin || isLoading}
            className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Verificando..." : "Acceder"}
          </button>
        </form>
      </div>
    </main>
  )
}
