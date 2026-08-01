import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import {
  INSTRUMENT_LABELS,
  INSTRUMENT_ROUTES,
  ROLE_LABELS,
  getInstrumentsForRole,
} from "@/lib/auth-utils";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role === "ADMIN") redirect("/admin");

  const instruments = await getInstrumentsForRole(session.role as any);

  // Determina si cada instrumento ya fue completado por este usuario
  const statusChecks = await Promise.all(
    instruments.map(async (instrument) => {
      let completed = false;
      switch (instrument.key) {
        case "ENTREVISTA":
          completed = !!(await db.interviewResponse.findUnique({
            where: { userId: session.userId },
          }))?.completed;
          break;
        case "ENCUESTA":
          completed = !!(await db.surveyResponse.findUnique({
            where: { userId: session.userId },
          }))?.completed;
          break;
        case "CHECKLIST_COBIT":
          completed = !!(await db.checklistResponse.findUnique({
            where: { userId: session.userId },
          }))?.completed;
          break;
        case "JUICIO_EXPERTOS":
          completed = !!(await db.expertValidation.findUnique({
            where: { userId: session.userId },
          }))?.completed;
          break;
      }
      return { instrument, completed };
    })
  );

  const pending = statusChecks.filter((s) => !s.completed);
  const done = statusChecks.filter((s) => s.completed);
  const progress = statusChecks.length
    ? Math.round((done.length / statusChecks.length) * 100)
    : 0;

  return (
    <AppShell fullName={session.fullName} roleLabel={ROLE_LABELS[session.role as keyof typeof ROLE_LABELS]}>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {session.fullName.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Estos son los instrumentos que te corresponden diligenciar.
        </p>

        <div className="card mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tu progreso</span>
            <span className="text-slate-500 dark:text-slate-400">
              {done.length} de {statusChecks.length} completados
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pendientes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pending.map(({ instrument }) => (
              <Link
                key={instrument.id}
                href={INSTRUMENT_ROUTES[instrument.key]}
                className="card group flex items-center justify-between transition hover:border-brand-400 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <Circle className="mt-0.5 shrink-0 text-brand-500" size={20} />
                  <div>
                    <p className="font-medium">
                      {INSTRUMENT_LABELS[instrument.key]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ~{instrument.estimatedMinutes} min
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Completados
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {done.map(({ instrument }) => (
              <div
                key={instrument.id}
                className="card flex items-center gap-3 opacity-70"
              >
                <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
                <p className="font-medium">{INSTRUMENT_LABELS[instrument.key]}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {statusChecks.length === 0 && (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-400">
          No tienes instrumentos asignados por el momento.
        </div>
      )}
    </AppShell>
  );
}
