"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: needsName ? fullName : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error. Intenta de nuevo.");
        return;
      }

      if (data.requiresFullName) {
        setNeedsName(true);
        return;
      }

      router.push(data.redirectAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Sistema de Recolección de Datos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            I.E. Francisco José de Caldas · Investigación de Maestría
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Correo electrónico institucional
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={needsName}
              className="input-field disabled:opacity-60"
              placeholder="nombre@institucion.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          {needsName && (
            <div className="animate-fade-in">
              <label className="label" htmlFor="fullName">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                className="input-field"
                placeholder="Escribe tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Es tu primer ingreso, por eso lo solicitamos una única vez.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : needsName ? (
              "Continuar"
            ) : (
              "Ingresar"
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            El sistema identifica tu rol automáticamente según tu correo.
            Solo verás los instrumentos que te correspondan.
          </p>
        </form>
      </div>
    </main>
  );
}
