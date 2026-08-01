import { PrismaClient } from "@prisma/client";
import {
  SURVEY_QUESTIONS,
  INTERVIEW_QUESTIONS,
  CHECKLIST_ITEMS,
  EXPERT_CRITERIA,
} from "../src/lib/instrument-content";

const db = new PrismaClient();

async function main() {
  console.log("Creando usuario administrador (investigador)...");

  // ⚠️ Cambia este correo por el tuyo antes de desplegar
  const adminEmail = process.env.ADMIN_EMAIL || "investigador@ejemplo.edu.co";

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: "Investigador Principal",
      role: "ADMIN",
    },
  });

  console.log(`Administrador listo: ${adminEmail}`);
  console.log("Creando definición de instrumentos...");

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
      assignedRoles: [
        "RECTOR",
        "COORDINADOR",
        "DOCENTE_TECNOLOGIA",
        "ORIENTADOR",
        "DOCENTE_APOYO",
      ],
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

  console.log("Seed completo ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
