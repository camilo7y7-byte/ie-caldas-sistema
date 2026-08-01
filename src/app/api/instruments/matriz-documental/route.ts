import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/auth-utils";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const entries = await db.documentAnalysisEntry.findMany({
    where: { userId: session.userId },
    orderBy: { startedAt: "desc" },
    include: { evidences: true },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const entry = await db.documentAnalysisEntry.create({
    data: {
      userId: session.userId,
      documentAnalyzed: body.documentAnalyzed || "",
      documentType: body.documentType || "",
      section: body.section || "",
      excerptFound: body.excerptFound || "",
      finding: body.finding || "",
      interpretation: body.interpretation || "",
      relationObjectives: body.relationObjectives || "",
      relationVariables: body.relationVariables || "",
      observations: body.observations || "",
      completed: !!body.completed,
      submittedAt: body.completed ? new Date() : null,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "CREATE",
    entity: "DocumentAnalysisEntry",
    entityId: entry.id,
  });

  return NextResponse.json({ entry });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const entry = await db.documentAnalysisEntry.update({
    where: { id: body.id },
    data: {
      documentAnalyzed: body.documentAnalyzed,
      documentType: body.documentType,
      section: body.section,
      excerptFound: body.excerptFound,
      finding: body.finding,
      interpretation: body.interpretation,
      relationObjectives: body.relationObjectives,
      relationVariables: body.relationVariables,
      observations: body.observations,
      completed: body.completed,
      submittedAt: body.completed ? new Date() : null,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "DocumentAnalysisEntry",
    entityId: entry.id,
  });

  return NextResponse.json({ entry });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  await db.documentAnalysisEntry.delete({ where: { id } });

  await logAudit({
    userId: session.userId,
    action: "DELETE",
    entity: "DocumentAnalysisEntry",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
