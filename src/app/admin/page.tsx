import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { ROLE_LABELS } from "@/lib/auth-utils";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell fullName={session.fullName} roleLabel={ROLE_LABELS.ADMIN}>
      <AdminNav />
      <AdminDashboardClient />
    </AppShell>
  );
}
