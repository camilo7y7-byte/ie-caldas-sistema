import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/auth-utils";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const backups = await db.backup.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ backups });
}

// Genera un respaldo completo en JSON y lo entrega como descarga directa.
// Nota: para producción se recomienda además subir este archivo a un bucket
// (Supabase Storage / S3) y guardar la URL real en el campo fileUrl.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [
    users,
    instruments,
    documentEntries,
    interviews,
    surveys,
    checklists,
    validations,
    auditLogs,
  ] = await Promise.all([
    db.user.findMany(),
    db.instrument.findMany(),
    db.documentAnalysisEntry.findMany(),
    db.interviewResponse.findMany(),
    db.surveyResponse.findMany(),
    db.checklistResponse.findMany(),
    db.expertValidation.findMany(),
    db.auditLog.findMany(),
  ]);

  const dump = {
    generatedAt: new Date().toISOString(),
    users,
    instruments,
    documentEntries,
    interviews,
    surveys,
    checklists,
    validations,
    auditLogs,
  };

  const json = JSON.stringify(dump, null, 2);
  const fileName = `respaldo-ie-caldas-${new Date().toISOString().slice(0, 10)}.json`;

  await db.backup.create({
    data: {
      fileName,
      fileUrl: "descarga-directa",
      sizeBytes: Buffer.byteLength(json),
      createdBy: session.userId,
    },
  });

  await logAudit({ userId: session.userId, action: "BACKUP", entity: "Database" });

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
