"use client";

import { useEffect, useState } from "react";
import { Database, Download, Loader2, ShieldAlert } from "lucide-react";

type BackupRow = { id: string; fileName: string; sizeBytes: number; createdAt: string };

export function BaseDatosClient() {
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadBackups() {
    const res = await fetch("/api/admin/backup");
    const data = await res.json();
    setBackups(data.backups || []);
    setLoading(false);
  }

  useEffect(() => {
    loadBackups();
  }, []);

  async function createBackup() {
    setCreating(true);
    const res = await fetch("/api/admin/backup", { method: "POST" });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      a.download = match ? match[1] : "respaldo.json";
      a.click();
      loadBackups();
    }
    setCreating(false);
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-2">
        <Database size={20} className="text-brand-500" />
        <h1 className="text-xl font-semibold">Base de datos</h1>
      </div>

      <div className="card">
        <h2 className="font-medium">Crear respaldo</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Genera un archivo JSON con toda la información del sistema (usuarios, instrumentos,
          respuestas e historial). Descárgalo y guárdalo en un lugar seguro.
        </p>
        <button className="btn-primary mt-4" onClick={createBackup} disabled={creating}>
          {creating ? <Loader2 className="animate-spin" size={18} /> : <Download size={16} className="mr-1.5" />}
          Crear y descargar respaldo
        </button>
      </div>

      <div className="card flex gap-3 text-sm text-amber-700 dark:text-amber-300">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          La restauración de un respaldo y la limpieza de la base de datos son operaciones sensibles.
          Por seguridad, estas acciones se realizan directamente sobre la base de datos (por ejemplo,
          desde el panel de Supabase) usando el archivo JSON exportado como referencia. El historial de
          auditoría nunca se elimina, incluso si se restaura una copia anterior.
        </p>
      </div>

      <div className="card overflow-x-auto p-0">
        <h2 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-800">
          Respaldos generados
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={22} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3">{b.fileName}</td>
                  <td className="px-4 py-3">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(b.createdAt).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    Aún no se han generado respaldos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
