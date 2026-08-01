import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/auth-utils";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  fullName: z.string().min(3, "El nombre completo es obligatorio").optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // El correo no fue precargado por el investigador -> no puede entrar.
    return NextResponse.json(
      {
        error:
          "Este correo no está registrado como participante de la investigación. Contacta al investigador.",
      },
      { status: 404 }
    );
  }

  if (!user.active) {
    return NextResponse.json(
      { error: "Este usuario ha sido desactivado. Contacta al investigador." },
      { status: 403 }
    );
  }

  // Primer ingreso: se requiere nombre completo si aún no existe.
  let fullName = user.fullName;
  if (!fullName) {
    if (!parsed.data.fullName) {
      return NextResponse.json({ requiresFullName: true }, { status: 200 });
    }
    fullName = parsed.data.fullName.trim();
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { fullName, lastLoginAt: new Date() },
  });

  await createSession({
    userId: updated.id,
    email: updated.email,
    role: updated.role,
    fullName: updated.fullName ?? "",
  });

  await logAudit({
    userId: updated.id,
    action: "LOGIN",
    entity: "User",
    entityId: updated.id,
  });

  return NextResponse.json({
    success: true,
    role: updated.role,
    redirectAdmin: updated.role === "ADMIN",
  });
}
