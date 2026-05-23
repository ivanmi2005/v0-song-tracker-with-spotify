"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const params = useSearchParams()
  const next = params.get("next") || "/admin"
  const initialError = params.get("error") ? "El enlace no es válido o ha caducado. Inténtalo de nuevo." : ""

  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(initialError)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const supabase = createClient()
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo },
      })

      if (error) {
        setError("No se pudo enviar el enlace de acceso.")
      } else {
        setSent(true)
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

        {sent ? (
          <>
            <p className="font-mono text-[0.7rem] text-muted-foreground mb-12 leading-relaxed">
              Te hemos enviado un enlace de acceso. Revisa tu correo y ábrelo en este dispositivo.
            </p>
            <button
              onClick={() => {
                setSent(false)
                setEmail("")
              }}
              className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Usar otro correo
            </button>
          </>
        ) : (
          <>
            <p className="font-mono text-[0.7rem] text-muted-foreground mb-12">
              Introduce tu correo para recibir un enlace de acceso
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
                className="w-full text-center bg-transparent border-b-[1.5px] border-border py-4 text-[1rem] focus:outline-none focus:border-foreground transition-colors text-foreground mb-8"
                autoFocus
              />

              {error && <p className="font-mono text-[0.65rem] text-red-600 mb-4">{error}</p>}

              <button
                type="submit"
                disabled={!email || isLoading}
                className="w-full py-[0.85rem] bg-foreground text-background font-mono text-[0.7rem] tracking-[0.12em] uppercase hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          </>
        )}
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
