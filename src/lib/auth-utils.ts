import { db } from "./db";
import { Role, InstrumentKey } from "@prisma/client";

// Mapa por defecto de qué instrumentos ve cada rol.
// El admin puede sobreescribir esto por instrumento vía Instrument.assignedRoles.
export const DEFAULT_INSTRUMENT_ROLES: Record<InstrumentKey, Role[]> = {
  MATRIZ_DOCUMENTAL: ["ADMIN"],
  ENTREVISTA: ["RECTOR", "COORDINADOR"],
  ENCUESTA: [
    "RECTOR",
    "COORDINADOR",
    "DOCENTE_TECNOLOGIA",
    "ORIENTADOR",
    "DOCENTE_APOYO",
  ],
  CHECKLIST_COBIT: ["DOCENTE_TECNOLOGIA", "COORDINADOR"],
  JUICIO_EXPERTOS: ["ADMIN"],
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Investigador (Administrador)",
  RECTOR: "Rector",
  COORDINADOR: "Coordinador",
  DOCENTE_TECNOLOGIA: "Docente de Tecnología e Informática",
  ORIENTADOR: "Orientador Escolar",
  DOCENTE_APOYO: "Docente de Apoyo (Inclusión Educativa)",
};

export const INSTRUMENT_LABELS: Record<InstrumentKey, string> = {
  MATRIZ_DOCUMENTAL: "Matriz de Análisis Documental",
  ENTREVISTA: "Entrevista Semiestructurada",
  ENCUESTA: "Encuesta",
  CHECKLIST_COBIT: "Lista de Chequeo COBIT 2019",
  JUICIO_EXPERTOS: "Validación por Juicio de Expertos",
};

export const INSTRUMENT_ROUTES: Record<InstrumentKey, string> = {
  MATRIZ_DOCUMENTAL: "/instrumentos/matriz-documental",
  ENTREVISTA: "/instrumentos/entrevista",
  ENCUESTA: "/instrumentos/encuesta",
  CHECKLIST_COBIT: "/instrumentos/checklist-cobit",
  JUICIO_EXPERTOS: "/instrumentos/juicio-expertos",
};

export async function getInstrumentsForRole(role: Role) {
  const instruments = await db.instrument.findMany({ where: { active: true } });
  return instruments.filter((i) => i.assignedRoles.includes(role));
}

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  changes?: unknown;
}) {
  await db.auditLog.create({
    data: {
      userId: params.userId ?? undefined,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      changesJson: params.changes ? JSON.parse(JSON.stringify(params.changes)) : undefined,
    },
  });
}
