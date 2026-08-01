import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/auth-utils";

/**
 * Crea los handlers GET / POST (autoguardado) / PUT (envío final) para un
 * instrumento cuyo modelo tiene un registro único por usuario (@@unique([userId])).
 *
 * `delegate` es el modelo de Prisma (ej. db.surveyResponse).
 * `dataField` es el nombre del campo JSON donde se guardan las respuestas.
 * `entityName` se usa para el registro de auditoría.
 */
export function createSingleInstrumentHandlers(
  delegate: any,
  dataField: string,
  entityName: string
) {
  async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const record = await delegate.findUnique({ where: { userId: session.userId } });
    return NextResponse.json({ record });
  }

  async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const existing = await delegate.findUnique({ where: { userId: session.userId } });

    if (existing?.completed) {
      return NextResponse.json(
        { error: "Este instrumento ya fue enviado y no puede modificarse." },
        { status: 403 }
      );
    }

    const record = await delegate.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, [dataField]: body.data, ...body.extraFields },
      update: { [dataField]: body.data, ...body.extraFields },
    });

    return NextResponse.json({ record, savedAt: new Date().toISOString() });
  }

  async function PUT() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const existing = await delegate.findUnique({ where: { userId: session.userId } });
    if (!existing) {
      return NextResponse.json(
        { error: "No hay respuestas guardadas para enviar." },
        { status: 400 }
      );
    }
    if (existing.completed) {
      return NextResponse.json({ error: "Ya fue enviado previamente." }, { status: 403 });
    }

    const record = await delegate.update({
      where: { userId: session.userId },
      data: { completed: true, submittedAt: new Date() },
    });

    await logAudit({
      userId: session.userId,
      action: "SUBMIT",
      entity: entityName,
      entityId: record.id,
    });

    return NextResponse.json({ record });
  }

  return { GET, POST, PUT };
}
