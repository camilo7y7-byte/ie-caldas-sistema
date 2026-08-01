"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Database, History, Download, FileSearch } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/instrumentos/matriz-documental", label: "Matriz Documental", icon: FileSearch },
  { href: "/admin/base-datos", label: "Base de datos", icon: Database },
  { href: "/admin/historial", label: "Historial", icon: History },
  { href: "/admin/exportar", label: "Exportar", icon: Download },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
              active
                ? "bg-brand-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
