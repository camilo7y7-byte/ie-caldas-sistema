"use client";

import { useEffect, useState } from "react";
import { Loader2, History } from "lucide-react";

type LogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { email: string; fullName: string | null } | null;
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  SUBMIT: "Envío de instrumento",
  IMPORT: "Importación",
  BACKUP: "Respaldo de base de datos",
};

export function HistorialClient() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-2">
        <History size={20} className="text-brand-500" />
        <h1 className="text-xl font-semibold">Historial de auditoría</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Registro inmutable de todas las acciones realizadas en el sistema. Nada se elimina de este historial.
      </p>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-500" size={24} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad afectada</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(log.createdAt).toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3">{log.user?.fullName || log.user?.email || "Sistema"}</td>
                  <td className="px-4 py-3">{ACTION_LABELS[log.action] || log.action}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {log.entity} {log.entityId ? `· ${log.entityId.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Aún no hay eventos registrados.
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
