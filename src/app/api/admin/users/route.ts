import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/auth-utils";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const roleEnum = z.enum([
  "RECTOR",
  "COORDINADOR",
  "DOCENTE_TECNOLOGIA",
  "ORIENTADOR",
  "DOCENTE_APOYO",
]);

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const users = await db.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const schema = z.object({
    email: z.string().email(),
    role: roleEnum,
    fullName: z.string().optional(),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      email: parsed.data.email.toLowerCase().trim(),
      role: parsed.data.role,
      fullName: parsed.data.fullName?.trim() || null,
    },
  });

  await logAudit({ userId: session.userId, action: "CREATE", entity: "User", entityId: user.id });
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const user = await db.user.update({
    where: { id: body.id },
    data: {
      fullName: body.fullName,
      role: body.role,
      active: body.active,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    changes: body,
  });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  await db.user.delete({ where: { id } });

  await logAudit({ userId: session.userId, action: "DELETE", entity: "User", entityId: id });
  return NextResponse.json({ success: true });
}
