"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InstrumentIntro } from "@/components/InstrumentIntro";
import { CHECKLIST_ITEMS } from "@/lib/instrument-content";
import { CheckCircle2, Loader2 } from "lucide-react";

type ItemState = { status: string; evidenceObserved: string };
type ItemsMap = Record<string, ItemState>;

const STATUS_OPTIONS = [
  { value: "CUMPLE", label: "Cumple" },
  { value: "CUMPLE_PARCIAL", label: "Cumple parcialmente" },
  { value: "NO_CUMPLE", label: "No cumple" },
];

export function ChecklistForm() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<ItemsMap>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/instruments/checklist")
      .then((r) => r.json())
      .then((data) => {
        if (data.record) {
          setItems(data.record.itemsJson || {});
          setCompleted(data.record.completed);
          if (data.record.completed || Object.keys(data.record.itemsJson || {}).length) {
            setStarted(true);
          }
        }
      });
  }, []);

  function updateItem(itemId: string, patch: Partial<ItemState>) {
    const next = {
      ...items,
      [itemId]: { status: "", evidenceObserved: "", ...items[itemId], ...patch },
    };
    setItems(next);
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch("/api/instruments/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      });
      setSaving(false);
    }, 600);
  }

  const validCount = CHECKLIST_ITEMS.filter(
    (item) => items[item.id]?.status && items[item.id]?.evidenceObserved?.trim()
  ).length;
  const allValid = validCount === CHECKLIST_ITEMS.length;

  async function handleSubmit() {
    if (!allValid) return;
    setSubmitting(true);
    const res = await fetch("/api/instruments/checklist", { method: "PUT" });
    if (res.ok) setCompleted(true);
    setSubmitting(false);
  }

  if (!started) {
    return (
      <InstrumentIntro
        title="Lista de Chequeo COBIT 2019"
        purpose="Una verificación estructurada del nivel de cumplimiento de prácticas de gobierno de TI según el marco COBIT 2019."
        importance="Permite establecer, con evidencia observable, el nivel de madurez actual de los procesos de TI institucionales."
        minutes={15}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="card flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-3 text-emerald-500" size={40} />
          <h2 className="text-lg font-semibold">¡Checklist enviado!</h2>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-6">
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-24">
      <h1 className="text-xl font-semibold">Lista de Chequeo COBIT 2019</h1>

      {CHECKLIST_ITEMS.map((item, idx) => {
        const state = items[item.id] || { status: "", evidenceObserved: "" };
        return (
          <div key={item.id} className="card">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {item.domain}
            </p>
            <p className="mb-3 text-sm font-medium">
              {idx + 1}. {item.text}
            </p>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border px-2 py-2 text-center text-xs transition ${
                    state.status === opt.value
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name={item.id}
                    className="sr-only"
                    checked={state.status === opt.value}
                    onChange={() => updateItem(item.id, { status: opt.value })}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <label className="label">Evidencia observada (obligatorio)</label>
            <textarea
              className="input-field min-h-[70px] resize-y"
              value={state.evidenceObserved}
              onChange={(e) => updateItem(item.id, { evidenceObserved: e.target.value })}
              placeholder="Describe la evidencia observada..."
            />
          </div>
        );
      })}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {saving ? "Guardando..." : `${validCount} de ${CHECKLIST_ITEMS.length} completos`}
          </span>
          <button onClick={handleSubmit} disabled={!allValid || submitting} className="btn-primary">
            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Enviar checklist"}
          </button>
        </div>
      </div>
    </div>
  );
}
