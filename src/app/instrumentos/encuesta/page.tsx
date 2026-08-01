import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ROLE_LABELS } from "@/lib/auth-utils";
import { EncuestaForm } from "./EncuestaForm";

export default async function EncuestaPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <AppShell
      fullName={session.fullName}
      roleLabel={ROLE_LABELS[session.role as keyof typeof ROLE_LABELS]}
    >
      <EncuestaForm />
    </AppShell>
  );
}
