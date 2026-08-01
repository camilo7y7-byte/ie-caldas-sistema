import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [
    totalUsers,
    activeUsers,
    interviewsDone,
    surveysDone,
    checklistsDone,
    validationsDone,
    usersByRole,
  ] = await Promise.all([
    db.user.count({ where: { role: { not: "ADMIN" } } }),
    db.user.count({ where: { role: { not: "ADMIN" }, active: true } }),
    db.interviewResponse.count({ where: { completed: true } }),
    db.surveyResponse.count({ where: { completed: true } }),
    db.checklistResponse.count({ where: { completed: true } }),
    db.expertValidation.count({ where: { completed: true } }),
    db.user.groupBy({
      by: ["role"],
      _count: { role: true },
      where: { role: { not: "ADMIN" } },
    }),
  ]);

  const usersWithLogin = await db.user.count({
    where: { role: { not: "ADMIN" }, lastLoginAt: { not: null } },
  });
  const pendingUsers = totalUsers - usersWithLogin;

  const totalCompleted = interviewsDone + surveysDone + checklistsDone + validationsDone;
  // Estimación simple del total esperado (se puede refinar según asignaciones reales)
  const totalPossible = Math.max(totalUsers, 1) * 1;

  return NextResponse.json({
    totalUsers,
    activeUsers,
    pendingUsers,
    interviewsDone,
    surveysDone,
    checklistsDone,
    validationsDone,
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count.role })),
    progressPercent: Math.min(
      100,
      Math.round((totalCompleted / Math.max(totalPossible, 1)) * 100)
    ),
  });
}
