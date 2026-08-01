"use client";

import { useEffect, useState } from "react";
import { Loader2, Eye, ChevronDown, ChevronUp, User } from "lucide-react";
import { INSTRUMENT_LABELS, ROLE_LABELS } from "@/lib/auth-utils";

const INSTRUMENTS = [
  "ENCUESTA",
  "ENTREVISTA",
  "CHECKLIST_COBIT",
  "JUICIO_EXPERTOS",
  "MATRIZ_DOCUMENTAL",
] as const;

type Entry = {
  id: string;
  participant: string;
  email: string;
  role?: string;
  submittedAt: string | null;
  items: { label: string; value: string; domain?: string }[];
};

export function RespuestasClient() {
  const [instrument, setInstrument] = useState<(typeof INSTRUMENTS)[number]>("ENCUESTA");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/responses?instrument=${instrument}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      });
  }, [instrument]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-2">
        <Eye size={20} className="text-brand-500" />
        <h1 className="text-xl font-semibold">Ver respuestas</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Consulta cada respuesta ya enviada, pregunta por pregunta, sin necesidad de exportar.
      </p>

      <div className="flex flex-wrap gap-2">
        {INSTRUMENTS.map((i) => (
          <button
            key={i}
            onClick={() => setInstrument(i)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              instrument === i
                ? "bg-brand-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {INSTRUMENT_LABELS[i]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-500" size={24} />
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-400">
          Aún no hay respuestas enviadas para este instrumento.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isOpen = expanded.has(entry.id);
            return (
              <div key={entry.id} className="card p-0 overflow-hidden">
                <button
                  onClick={() => toggle(entry.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="font-medium">{entry.participant}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.email}
                        {entry.role ? ` · ${ROLE_LABELS[entry.role as keyof typeof ROLE_LABELS]}` : ""}
                        {entry.submittedAt ? ` · ${entry.submittedAt}` : ""}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
                    {entry.items.map((item, idx) => (
                      <div key={idx}>
                        {item.domain && (
                          <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                            {item.domain}
                          </p>
                        )}
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="whitespace-pre-line text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
