"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InstrumentIntro } from "@/components/InstrumentIntro";
import { INTERVIEW_QUESTIONS } from "@/lib/instrument-content";
import { CheckCircle2, Loader2 } from "lucide-react";

type Answers = Record<string, string>;

export function EntrevistaForm() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/instruments/entrevista")
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
      await fetch("/api/instruments/entrevista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      });
      setSaving(false);
    }, 700);
  }

  const answeredCount = Object.values(answers).filter((a) => a?.trim()).length;
  const allAnswered = answeredCount === INTERVIEW_QUESTIONS.length;

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    const res = await fetch("/api/instruments/entrevista", { method: "PUT" });
    if (res.ok) setCompleted(true);
    setSubmitting(false);
  }

  if (!started) {
    return (
      <InstrumentIntro
        title="Entrevista Semiestructurada"
        purpose="Una serie de preguntas abiertas sobre el gobierno de TI y los servicios tecnológicos institucionales."
        importance="Tu experiencia y perspectiva son fundamentales para comprender en profundidad la situación actual y las necesidades reales de la institución."
        minutes={20}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="card flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-3 text-emerald-500" size={40} />
          <h2 className="text-lg font-semibold">¡Entrevista enviada!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gracias por compartir tu experiencia.
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
      <h1 className="text-xl font-semibold">Entrevista Semiestructurada</h1>

      {INTERVIEW_QUESTIONS.map((q, idx) => (
        <div key={q.id} className="card">
          <label className="label">
            {idx + 1}. {q.text}
          </label>
          <textarea
            className="input-field min-h-[120px] resize-y"
            value={answers[q.id] || ""}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
          />
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {saving ? "Guardando..." : `${answeredCount} de ${INTERVIEW_QUESTIONS.length} respondidas`}
          </span>
          <button onClick={handleSubmit} disabled={!allAnswered || submitting} className="btn-primary">
            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Enviar entrevista"}
          </button>
        </div>
      </div>
    </div>
  );
}
