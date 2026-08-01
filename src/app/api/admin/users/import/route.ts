import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/auth-utils";

const VALID_ROLES = [
  "RECTOR",
  "COORDINADOR",
  "DOCENTE_TECNOLOGIA",
  "ORIENTADOR",
  "DOCENTE_APOYO",
];

// Formato esperado del Excel: columnas "correo", "rol", "nombre" (opcional)
// El rol debe escribirse tal cual: RECTOR, COORDINADOR, DOCENTE_TECNOLOGIA,
// ORIENTADOR, DOCENTE_APOYO
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  const headerRow = sheet.getRow(1).values as any[];
  const colIndex = (name: string) =>
    headerRow.findIndex((h) => String(h).toLowerCase().trim() === name);

  const emailCol = colIndex("correo");
  const roleCol = colIndex("rol");
  const nameCol = colIndex("nombre");

  if (emailCol === -1 || roleCol === -1) {
    return NextResponse.json(
      { error: "El archivo debe tener columnas 'correo' y 'rol' (y opcionalmente 'nombre')." },
      { status: 400 }
    );
  }

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const email = String(row.getCell(emailCol).value || "").toLowerCase().trim();
    const role = String(row.getCell(roleCol).value || "").toUpperCase().trim();
    const name = nameCol !== -1 ? String(row.getCell(nameCol).value || "").trim() : "";

    if (!email) continue;
    if (!VALID_ROLES.includes(role)) {
      results.errors.push(`Fila ${i}: rol inválido "${role}"`);
      continue;
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      results.skipped++;
      continue;
    }

    await db.user.create({
      data: { email, role: role as any, fullName: name || null },
    });
    results.created++;
  }

  await logAudit({
    userId: session.userId,
    action: "IMPORT",
    entity: "User",
    changes: results,
  });

  return NextResponse.json(results);
}
