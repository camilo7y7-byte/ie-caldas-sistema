"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InstrumentIntro } from "@/components/InstrumentIntro";
import { SURVEY_QUESTIONS, LIKERT_OPTIONS } from "@/lib/instrument-content";
import { CheckCircle2, Loader2 } from "lucide-react";

type Answers = Record<string, string>;

export function EncuestaForm() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/instruments/encuesta")
      .then((r) => r.json())
      .then((data) => {
        if (data.record) {
          setAnswers(data.record.answersJson || {});
          setCompleted(data.record.completed);
          if (data.record.completed || Object.keys(data.record.answersJson || {}).length) {
            setStarted(true);
          }
        }
      });
  }, []);

  function updateAnswer(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch("/api/instruments/encuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      });
      setSaving(false);
      setLastSaved(new Date());
    }, 600);
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === SURVEY_QUESTIONS.length;

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    const res = await fetch("/api/instruments/encuesta", { method: "PUT" });
    if (res.ok) {
      setCompleted(true);
    }
    setSubmitting(false);
  }

  if (!started) {
    return (
      <InstrumentIntro
        title="Encuesta"
        purpose="Un cuestionario de percepción sobre el gobierno de TI, los servicios tecnológicos y su relación con los procesos de inclusión educativa."
        importance="Tus respuestas permiten identificar de forma cuantitativa el estado actual percibido por la comunidad educativa, insumo clave para el diagnóstico de la investigación."
        minutes={5}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="card flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-3 text-emerald-500" size={40} />
          <h2 className="text-lg font-semibold">¡Encuesta enviada!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gracias por tu participación. Tus respuestas fueron registradas correctamente.
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-6">
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Encuesta</h1>
        <span className="text-xs text-slate-400">
          {saving ? (
            <span className="flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Guardando...
            </span>
          ) : lastSaved ? (
            "Guardado ✓"
          ) : (
            ""
          )}
        </span>
      </div>

      {SURVEY_QUESTIONS.map((q, idx) => (
        <div key={q.id} className="card">
          <p className="mb-3 text-sm font-medium">
            {idx + 1}. {q.text}
          </p>
          <div className="grid gap-2 sm:grid-cols-5">
            {LIKERT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-xl border px-2 py-2 text-center text-xs transition ${
                  answers[q.id] === opt.value
                    ? "border-brand-500 bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={opt.value}
                  className="sr-only"
                  checked={answers[q.id] === opt.value}
                  onChange={() => updateAnswer(q.id, opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {answeredCount} de {SURVEY_QUESTIONS.length} respondidas
          </span>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="btn-primary"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Enviar encuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}
