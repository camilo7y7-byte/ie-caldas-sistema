"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, ShieldCheck } from "lucide-react";

export function AppShell({
  fullName,
  roleLabel,
  children,
}: {
  fullName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ShieldCheck size={18} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">I.E. Francisco José de Caldas</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recolección de datos · Investigación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
