"use client";

import { Clock, Lock, Info } from "lucide-react";

export function InstrumentIntro({
  title,
  purpose,
  importance,
  minutes,
  onStart,
}: {
  title: string;
  purpose: string;
  importance: string;
  minutes: number;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="card">
        <h1 className="text-xl font-semibold">{title}</h1>

        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex gap-2">
            <Info size={18} className="mt-0.5 shrink-0 text-brand-500" />
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                ¿Qué vas a diligenciar?{" "}
              </span>
              {purpose}
            </p>
          </div>
          <div className="flex gap-2">
            <Info size={18} className="mt-0.5 shrink-0 text-brand-500" />
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                ¿Por qué es importante?{" "}
              </span>
              {importance}
            </p>
          </div>
          <div className="flex gap-2">
            <Clock size={18} className="mt-0.5 shrink-0 text-brand-500" />
            <p>Tiempo estimado: aproximadamente {minutes} minutos.</p>
          </div>
          <div className="flex gap-2">
            <Lock size={18} className="mt-0.5 shrink-0 text-brand-500" />
            <p>
              Tus respuestas se guardan automáticamente y son confidenciales.
              Solo el equipo investigador tendrá acceso a la información
              detallada. Una vez enviado el formulario, no podrá modificarse.
            </p>
          </div>
        </div>

        <button onClick={onStart} className="btn-primary mt-6 w-full">
          Comenzar
        </button>
      </div>
    </div>
  );
}
