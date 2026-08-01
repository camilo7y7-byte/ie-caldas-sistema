"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InstrumentIntro } from "@/components/InstrumentIntro";
import { EXPERT_CRITERIA } from "@/lib/instrument-content";
import { CheckCircle2, Loader2 } from "lucide-react";

type Criteria = Record<string, number>;
type TextFields = {
  strengths: string;
  weaknesses: string;
  observations: string;
  recommendations: string;
  finalConcept: string;
};

const EMPTY_TEXT: TextFields = {
  strengths: "",
  weaknesses: "",
  observations: "",
  recommendations: "",
  finalConcept: "",
};

export function ExpertForm() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [criteria, setCriteria] = useState<Criteria>({});
  const [text, setText] = useState<TextFields>(EMPTY_TEXT);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/instruments/juicio-expertos")
      .then((r) => r.json())
      .then((data) => {
        if (data.record) {
          setCriteria(data.record.criteriaJson || {});
          setText({
            strengths: data.record.strengths || "",
            weaknesses: data.record.weaknesses || "",
            observations: data.record.observations || "",
            recommendations: data.record.recommendations || "",
            finalConcept: data.record.finalConcept || "",
          });
          setCompleted(data.record.completed);
          if (data.record.completed || Object.keys(data.record.criteriaJson || {}).length) {
            setStarted(true);
          }
        }
      });
  }, []);

  function scheduleSave(nextCriteria: Criteria, nextText: TextFields) {
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch("/api/instruments/juicio-expertos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextCriteria, extraFields: nextText }),
      });
      setSaving(false);
    }, 700);
  }

  function updateScore(criterionId: string, score: number) {
    const next = { ...criteria, [criterionId]: score };
    setCriteria(next);
    scheduleSave(next, text);
  }

  function updateText(field: keyof TextFields, value: string) {
    const next = { ...text, [field]: value };
    setText(next);
    scheduleSave(criteria, next);
  }

  const allScored = EXPERT_CRITERIA.every((c) => criteria[c.id]);
  const canSubmit = allScored && text.strengths.trim() && text.weaknesses.trim() && text.finalConcept.trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await fetch("/api/instruments/juicio-expertos", { method: "PUT" });
    if (res.ok) setCompleted(true);
    setSubmitting(false);
  }

  if (!started) {
    return (
      <InstrumentIntro
        title="Validación por Juicio de Expertos"
        purpose="Una evaluación técnica de los instrumentos de investigación por parte de expertos en el área."
        importance="Tu experticia garantiza la validez de contenido de los instrumentos antes de su aplicación definitiva."
        minutes={25}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="card flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-3 text-emerald-500" size={40} />
          <h2 className="text-lg font-semibold">¡Validación enviada!</h2>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-6">
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-24">
      <h1 className="text-xl font-semibold">Validación por Juicio de Expertos</h1>

      {EXPERT_CRITERIA.map((c, idx) => (
        <div key={c.id} className="card">
          <p className="mb-3 text-sm font-medium">
            {idx + 1}. {c.text}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className={`cursor-pointer rounded-xl border py-2 text-center text-sm font-medium transition ${
                  criteria[c.id] === n
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name={c.id}
                  className="sr-only"
                  checked={criteria[c.id] === n}
                  onChange={() => updateScore(c.id, n)}
                />
                {n}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="card space-y-4">
        <div>
          <label className="label">Fortalezas</label>
          <textarea className="input-field min-h-[80px]" value={text.strengths} onChange={(e) => updateText("strengths", e.target.value)} />
        </div>
        <div>
          <label className="label">Debilidades</label>
          <textarea className="input-field min-h-[80px]" value={text.weaknesses} onChange={(e) => updateText("weaknesses", e.target.value)} />
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea className="input-field min-h-[80px]" value={text.observations} onChange={(e) => updateText("observations", e.target.value)} />
        </div>
        <div>
          <label className="label">Recomendaciones</label>
          <textarea className="input-field min-h-[80px]" value={text.recommendations} onChange={(e) => updateText("recommendations", e.target.value)} />
        </div>
        <div>
          <label className="label">Concepto final</label>
          <textarea className="input-field min-h-[80px]" value={text.finalConcept} onChange={(e) => updateText("finalConcept", e.target.value)} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {saving ? "Guardando..." : "Completa todos los campos para enviar"}
          </span>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="btn-primary">
            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Enviar validación"}
          </button>
        </div>
      </div>
    </div>
  );
}
