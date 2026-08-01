"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, File, FileType, Loader2, Download } from "lucide-react";
import { INSTRUMENT_LABELS } from "@/lib/auth-utils";

const INSTRUMENTS = [
  "MATRIZ_DOCUMENTAL",
  "ENTREVISTA",
  "ENCUESTA",
  "CHECKLIST_COBIT",
  "JUICIO_EXPERTOS",
] as const;

const FORMATS = [
  { key: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet },
  { key: "docx", label: "Word (.docx)", icon: FileText },
  { key: "pdf", label: "PDF", icon: File },
  { key: "csv", label: "CSV", icon: FileType },
];

export function ExportarClient() {
  const [instrument, setInstrument] = useState<(typeof INSTRUMENTS)[number]>("ENCUESTA");
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: string) {
    setLoadingFormat(format);
    setError(null);
    const res = await fetch(`/api/admin/export?instrument=${instrument}&format=${format}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No fue posible exportar.");
      setLoadingFormat(null);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="(.+)"/);
    a.download = match ? match[1] : `export.${format}`;
    a.click();
    setLoadingFormat(null);
  }

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-xl font-semibold">Exportar resultados</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Solo se exportan respuestas enviadas (completadas). Los formatos conservan tablas, nombres y fechas.
      </p>

      <div className="card">
        <label className="label">Instrumento</label>
        <select
          className="input-field"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value as any)}
        >
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {INSTRUMENT_LABELS[i]}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FORMATS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleExport(key)}
              disabled={loadingFormat === key}
              className="btn-secondary flex-col gap-1.5 py-4"
            >
              {loadingFormat === key ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Icon size={20} />
              )}
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <Download size={18} className="shrink-0 text-brand-500" />
        Puedes exportar cada instrumento las veces que necesites; los archivos se generan al momento con la información más reciente.
      </div>
    </div>
  );
}
