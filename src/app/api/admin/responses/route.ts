import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { INSTRUMENT_LABELS } from "@/lib/auth-utils";
import { SURVEY_QUESTIONS, INTERVIEW_QUESTIONS, CHECKLIST_ITEMS } from "@/lib/instrument-content";

const LIKERT_LABELS: Record<string, string> = {
  TOTALMENTE_DESACUERDO: "Totalmente en desacuerdo",
  DESACUERDO: "En desacuerdo",
  NEUTRAL: "Ni de acuerdo ni en desacuerdo",
  DE_ACUERDO: "De acuerdo",
  TOTALMENTE_ACUERDO: "Totalmente de acuerdo",
};

const CHECKLIST_STATUS_LABELS: Record<string, string> = {
  CUMPLE: "Cumple",
  CUMPLE_PARCIAL: "Cumple parcialmente",
  NO_CUMPLE: "No cumple",
};

type Entry = {
  id: string;
  participant: string;
  email: string;
  role?: string;
  submittedAt: string | null;
  items: { label: string; value: string; domain?: string }[];
};

async function buildEntries(instrumentKey: string): Promise<{ title: string; entries: Entry[] }> {
  switch (instrumentKey) {
    case "ENTREVISTA": {
      const data = await db.interviewResponse.findMany({
        where: { completed: true },
        include: { user: true },
        orderBy: { submittedAt: "desc" },
      });
      return {
        title: INSTRUMENT_LABELS.ENTREVISTA,
        entries: data.map((d) => {
          const answers = (d.answersJson as Record<string, string>) || {};
          return {
            id: d.id,
            participant: d.user.fullName || d.user.email,
            email: d.user.email,
            role: d.user.role,
            submittedAt: d.submittedAt?.toLocaleString("es-CO") || null,
            items: INTERVIEW_QUESTIONS.map((q, idx) => ({
              label: `${idx + 1}. ${q.text}`,
              value: answers[q.id] || "(sin respuesta)",
            })),
          };
        }),
      };
    }
    case "ENCUESTA": {
      const data = await db.surveyResponse.findMany({
        where: { completed: true },
        include: { user: true },
        orderBy: { submittedAt: "desc" },
      });
      return {
        title: INSTRUMENT_LABELS.ENCUESTA,
        entries: data.map((d) => {
          const answers = (d.answersJson as Record<string, string>) || {};
          return {
            id: d.id,
            participant: d.user.fullName || d.user.email,
            email: d.user.email,
            role: d.user.role,
            submittedAt: d.submittedAt?.toLocaleString("es-CO") || null,
            items: SURVEY_QUESTIONS.map((q, idx) => {
              const value = answers[q.id];
              return {
                label: `${idx + 1}. ${q.text}`,
                value: value ? LIKERT_LABELS[value] || value : "(sin respuesta)",
              };
            }),
          };
        }),
      };
    }
    case "CHECKLIST_COBIT": {
      const data = await db.checklistResponse.findMany({
        where: { completed: true },
        include: { user: true },
        orderBy: { submittedAt: "desc" },
      });
      return {
        title: INSTRUMENT_LABELS.CHECKLIST_COBIT,
        entries: data.map((d) => {
          const items = (d.itemsJson as Record<string, { status: string; evidenceObserved: string }>) || {};
          return {
            id: d.id,
            participant: d.user.fullName || d.user.email,
            email: d.user.email,
            role: d.user.role,
            submittedAt: d.submittedAt?.toLocaleString("es-CO") || null,
            items: CHECKLIST_ITEMS.map((item, idx) => {
              const entry = items[item.id];
              const statusLabel = entry?.status ? CHECKLIST_STATUS_LABELS[entry.status] || entry.status : "(sin respuesta)";
              return {
                domain: item.domain,
                label: `${idx + 1}. ${item.text}`,
                value: entry ? `${statusLabel}\nEvidencia: ${entry.evidenceObserved || "(ninguna)"}` : "(sin respuesta)",
              };
            }),
          };
        }),
      };
    }
    case "JUICIO_EXPERTOS": {
      const data = await db.expertValidation.findMany({
        where: { completed: true },
        include: { user: true },
        orderBy: { submittedAt: "desc" },
      });
      return {
        title: INSTRUMENT_LABELS.JUICIO_EXPERTOS,
        entries: data.map((d) => {
          const criteria = (d.criteriaJson as Record<string, number>) || {};
          const items = [
            ...Object.entries(criteria).map(([critId, score]) => ({
              label: `Criterio ${critId}`,
              value: `${score} / 5`,
            })),
            { label: "Fortalezas", value: d.strengths || "(sin respuesta)" },
            { label: "Debilidades", value: d.weaknesses || "(sin respuesta)" },
            { label: "Observaciones", value: d.observations || "(sin respuesta)" },
            { label: "Recomendaciones", value: d.recommendations || "(sin respuesta)" },
            { label: "Concepto final", value: d.finalConcept || "(sin respuesta)" },
          ];
          return {
            id: d.id,
            participant: d.user.fullName || d.user.email,
            email: d.user.email,
            submittedAt: d.submittedAt?.toLocaleString("es-CO") || null,
            items,
          };
        }),
      };
    }
    case "MATRIZ_DOCUMENTAL": {
      const data = await db.documentAnalysisEntry.findMany({
        include: { user: true },
        orderBy: { startedAt: "desc" },
      });
      return {
        title: INSTRUMENT_LABELS.MATRIZ_DOCUMENTAL,
        entries: data.map((d) => ({
          id: d.id,
          participant: d.documentAnalyzed || "(sin título)",
          email: d.user.email,
          submittedAt: d.submittedAt?.toLocaleString("es-CO") || (d.completed ? null : "Borrador"),
          items: [
            { label: "Tipo de documento", value: d.documentType || "" },
            { label: "Sección", value: d.section || "" },
            { label: "Fragmento encontrado", value: d.excerptFound || "" },
            { label: "Hallazgo", value: d.finding || "" },
            { label: "Interpretación", value: d.interpretation || "" },
            { label: "Relación con objetivos", value: d.relationObjectives || "" },
            { label: "Relación con variables", value: d.relationVariables || "" },
            { label: "Observaciones", value: d.observations || "" },
          ],
        })),
      };
    }
    default:
      return { title: "Instrumento", entries: [] };
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const instrument = searchParams.get("instrument") || "ENCUESTA";
  const result = await buildEntries(instrument);
  return NextResponse.json(result);
}
