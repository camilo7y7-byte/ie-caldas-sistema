"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";

const EMPTY_ENTRY = {
  documentAnalyzed: "",
  documentType: "",
  section: "",
  excerptFound: "",
  finding: "",
  interpretation: "",
  relationObjectives: "",
  relationVariables: "",
  observations: "",
};

const FIELDS: { key: keyof typeof EMPTY_ENTRY; label: string; area?: boolean }[] = [
  { key: "documentAnalyzed", label: "Documento analizado" },
  { key: "documentType", label: "Tipo de documento" },
  { key: "section", label: "Sección" },
  { key: "excerptFound", label: "Fragmento encontrado", area: true },
  { key: "finding", label: "Hallazgo", area: true },
  { key: "interpretation", label: "Interpretación", area: true },
  { key: "relationObjectives", label: "Relación con objetivos", area: true },
  { key: "relationVariables", label: "Relación con variables", area: true },
  { key: "observations", label: "Observaciones", area: true },
];

export function MatrizForm() {
  const [entries, setEntries] = useState<any[]>([]);
  const [draft, setDraft] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadEntries() {
    const res = await fetch("/api/instruments/matriz-documental");
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function saveDraft(final: boolean) {
    if (!draft) return;
    setSaving(true);
    const method = draft.id ? "PUT" : "POST";
    await fetch("/api/instruments/matriz-documental", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, completed: final }),
    });
    setSaving(false);
    setDraft(null);
    loadEntries();
  }

  async function deleteEntry(id: string) {
    if (!confirm("¿Eliminar esta entrada de la matriz?")) return;
    await fetch("/api/instruments/matriz-documental", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadEntries();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  if (draft) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-24">
        <h1 className="text-xl font-semibold">
          {draft.id ? "Editar entrada" : "Nueva entrada"} · Matriz de Análisis Documental
        </h1>
        <div className="card space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.area ? (
                <textarea
                  className="input-field min-h-[80px]"
                  value={draft[f.key] || ""}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  className="input-field"
                  value={draft[f.key] || ""}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-2xl items-center justify-end gap-3">
            <button className="btn-secondary" onClick={() => setDraft(null)}>
              Cancelar
            </button>
            <button className="btn-secondary" disabled={saving} onClick={() => saveDraft(false)}>
              Guardar borrador
            </button>
            <button className="btn-primary" disabled={saving} onClick={() => saveDraft(true)}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : "Guardar y marcar completa"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Matriz de Análisis Documental</h1>
        <button className="btn-primary" onClick={() => setDraft({ ...EMPTY_ENTRY })}>
          <Plus size={16} className="mr-1" /> Nueva entrada
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-400">
          Aún no has registrado ninguna entrada.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="card flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <FileText size={18} className="mt-1 shrink-0 text-brand-500" />
                <div>
                  <p className="font-medium">{entry.documentAnalyzed || "(sin título)"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {entry.documentType} · {entry.section} ·{" "}
                    {entry.completed ? "Completa" : "Borrador"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn-secondary" onClick={() => setDraft(entry)}>
                  Editar
                </button>
                <button
                  className="rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
