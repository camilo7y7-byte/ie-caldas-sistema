import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SURVEY_QUESTIONS,
  INTERVIEW_QUESTIONS,
  CHECKLIST_ITEMS,
  EXPERT_CRITERIA,
} from "@/lib/instrument-content";

// Endpoint de un solo uso: se visita UNA VEZ desde el navegador para crear
// el usuario administrador y los 5 instrumentos base, sin necesidad de
// ejecutar ningún comando. Requiere el parámetro ?key= que coincida con
// SETUP_SECRET (variable de entorno) para evitar que cualquiera lo use.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!process.env.SETUP_SECRET || key !== process.env.SETUP_SECRET) {
    return new NextResponse("No autorizado. Verifica el parámetro ?key= en la URL.", { status: 403 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!adminEmail) {
    return new NextResponse("Falta configurar la variable de entorno ADMIN_EMAIL.", { status: 400 });
  }

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, fullName: "Investigador Principal", role: "ADMIN" },
  });

  await db.instrument.upsert({
    where: { key: "MATRIZ_DOCUMENTAL" },
    update: {},
    create: {
      key: "MATRIZ_DOCUMENTAL",
      title: "Matriz de Análisis Documental",
      description: "Registro y análisis de documentos institucionales relevantes.",
      estimatedMinutes: 30,
      assignedRoles: ["ADMIN"],
      schemaJson: { type: "repeatable-log" },
    },
  });

  await db.instrument.upsert({
    where: { key: "ENTREVISTA" },
    update: {},
    create: {
      key: "ENTREVISTA",
      title: "Entrevista Semiestructurada",
      description: "Preguntas abiertas sobre gobierno de TI y servicios tecnológicos.",
      estimatedMinutes: 20,
      assignedRoles: ["RECTOR", "COORDINADOR"],
      schemaJson: { questions: INTERVIEW_QUESTIONS },
    },
  });

  await db.instrument.upsert({
    where: { key: "ENCUESTA" },
    update: {},
    create: {
      key: "ENCUESTA",
      title: "Encuesta",
      description: "Cuestionario de percepción con escala Likert.",
      estimatedMinutes: 5,
      assignedRoles: ["RECTOR", "COORDINADOR", "DOCENTE_TECNOLOGIA", "ORIENTADOR", "DOCENTE_APOYO"],
      schemaJson: { questions: SURVEY_QUESTIONS },
    },
  });

  await db.instrument.upsert({
    where: { key: "CHECKLIST_COBIT" },
    update: {},
    create: {
      key: "CHECKLIST_COBIT",
      title: "Lista de Chequeo COBIT 2019",
      description: "Verificación de cumplimiento de prácticas de gobierno de TI.",
      estimatedMinutes: 15,
      assignedRoles: ["DOCENTE_TECNOLOGIA", "COORDINADOR"],
      schemaJson: { items: CHECKLIST_ITEMS },
    },
  });

  await db.instrument.upsert({
    where: { key: "JUICIO_EXPERTOS" },
    update: {},
    create: {
      key: "JUICIO_EXPERTOS",
      title: "Validación por Juicio de Expertos",
      description: "Evaluación técnica de los instrumentos por expertos.",
      estimatedMinutes: 25,
      assignedRoles: ["ADMIN"],
      schemaJson: { criteria: EXPERT_CRITERIA },
    },
  });

  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2>✅ Configuración completada</h2>
      <p>Se creó el administrador (<b>${adminEmail}</b>) y los 5 instrumentos.</p>
      <p>Ya puedes ir a la página principal e ingresar con ese correo.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
