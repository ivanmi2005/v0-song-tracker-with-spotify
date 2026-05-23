"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"

  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(next)
        router.refresh()
      } else {
        setError("Contraseña incorrecta")
        setPassword("")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="max-w-[22rem] mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="font-sans font-medium text-[1.8rem] tracking-[-0.03em] leading-none text-foreground mb-2">
          Acceso Restringido
        </h1>
        <p className="font-mono text-[0.7rem] text-muted-foreground mb-12">Introduce la contraseña de acceso</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError("")
            }}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full text-center bg-transparent border-b-[1.5px] border-border py-4 text-[1.25rem] tracking-[0.2em] focus:outline-none focus:border-foreground transition-colors text-foreground mb-8"
            autoFocus
          />

          {error && <p className="font-mono text-[0.65rem] text-red-600 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={!password || isLoading}
            className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Verificando..." : "Acceder"}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background flex items-center justify-center font-sans">
          <p className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-muted-foreground">Cargando...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
