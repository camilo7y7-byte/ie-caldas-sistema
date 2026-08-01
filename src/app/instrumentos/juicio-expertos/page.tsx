import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ROLE_LABELS } from "@/lib/auth-utils";
import { ExpertForm } from "./ExpertForm";

export default async function ExpertPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <AppShell
      fullName={session.fullName}
      roleLabel={ROLE_LABELS[session.role as keyof typeof ROLE_LABELS]}
    >
      <ExpertForm />
    </AppShell>
  );
}
