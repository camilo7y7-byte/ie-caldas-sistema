"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, UserCheck, MessageSquare, ClipboardList, CheckSquare, Award, Loader2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-utils";

type Stats = {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  interviewsDone: number;
  surveysDone: number;
  checklistsDone: number;
  validationsDone: number;
  usersByRole: { role: string; count: number }[];
  progressPercent: number;
};

const COLORS = ["#2557f0", "#4d7fff", "#80a9ff", "#1a41c9", "#152663", "#b3ccff"];

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  const instrumentData = [
    { name: "Entrevistas", value: stats.interviewsDone },
    { name: "Encuestas", value: stats.surveysDone },
    { name: "Checklist COBIT", value: stats.checklistsDone },
    { name: "Validaciones", value: stats.validationsDone },
  ];

  const roleData = stats.usersByRole.map((r) => ({
    name: ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] || r.role,
    value: r.count,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users} label="Usuarios registrados" value={stats.totalUsers} />
        <StatCard icon={UserCheck} label="Activos" value={stats.activeUsers} />
        <StatCard icon={Users} label="Pendientes por ingresar" value={stats.pendingUsers} />
        <StatCard icon={MessageSquare} label="Entrevistas realizadas" value={stats.interviewsDone} />
        <StatCard icon={ClipboardList} label="Encuestas realizadas" value={stats.surveysDone} />
        <StatCard icon={CheckSquare} label="Checklist COBIT" value={stats.checklistsDone} />
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Porcentaje de avance general</span>
          <span className="text-slate-500 dark:text-slate-400">{stats.progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${stats.progressPercent}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold">Instrumentos completados</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={instrumentData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2557f0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold">Usuarios por rol</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {roleData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
